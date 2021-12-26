import{getDistance} from './helpers.js';

/**
 * A class which holds some constants
 */
export class targetRecall {
  constructor(combatId = '', combatantId = '', tokenId = '', past = false) {
    this.combatantId = combatantId,
    this.combatId = combatId,
    this.tokenId = tokenId,
    this.past = past;

    if(!combatId) this._initialize();
  }
  
  static ID = 'target-recall';
  static NAME = 'targetRecall';
  
  static FLAGS = {
    TARGETRECALL: 'target-recall',
    SUPPRESS: 'suppress'
  }

  static KEYBINDS = {
    BACK: 'history-back',
    FORWARD: 'history-forward'
  }

  static TEMPLATES = {}

  /**
   * A small helper function which leverages developer mode flags to gate debug logs.
   * @param {boolean} force - forces the log even if the debug flag is not on
   * @param  {...any} args - what to log
  */
  static log(force, ...args) {  
    const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

    if (shouldLog) {
      console.log(this.ID, '|', ...args);
    }
  }

  _initialize(){
    const c = canvas.tokens.controlled.find(t => t.combatant && t.combatant.combat?.current?.combatantId === t.combatant.id)
    if(c){
      this.combatId = c.combatant.combat.id,
      this.combatantId = c.combatant.id,
      this.tokenId = c.id
    }
  }

  get combatant(){
    return game.combats.get(this.combatId)?.combatants.get(this.combatantId)
  }

  get recall(){
    if(!this.combatant) return
    return this._toClass(this.combatant.getFlag(targetRecall.ID, targetRecall.FLAGS.TARGETRECALL + `.${game.user.id}`)) 
  }

  _toClass(flag){
    return (flag?.combatantId) ? mergeObject(new recall(), flag, {insertKeys: false, enforceTypes: true}) : new recall(this.combatId, this.combatantId)
  }

  static clear(userId, checkIf = true){
    if (!(checkIf && !game.settings.get(this.ID, "clear"))) game.users.get(userId).updateTokenTargets([])
  }

  static async recallTargets(past = false, combatId = '', combatantId = '', tokenId = ''){
    if(!game.settings.get(targetRecall.ID, 'active')) return false
    const tr = new targetRecall(combatId, combatantId, tokenId, true)
    targetRecall.log(false, 'recallTargets', {'targetRecall': tr});
    const result = await tr.recall.recall(this.past)
    return result
  }

  static async set(combatId, combatantId, tokenId){
    const tr = new targetRecall(combatId, combatantId, tokenId)
    await tr.recall?.set()
    targetRecall.log(false, 'set', {'targetRecall': tr});
  }

  static async target() {
    const tr = new targetRecall()
    targetRecall.log(false, 'target', {'targetRecall': tr});
    if(tr.recall) await tr.recall.target();
  } 

  static async tokenRecall(token, html) {
    if(token){
      const flag = token.getFlag(this.ID, this.FLAGS.SUPPRESS + `.${game.user.id}`);
      if(!flag){
        await token.setFlag(this.ID, this.FLAGS.SUPPRESS, {[game.user.id]: true});
        html.find('div[data-action=target]').addClass('no-target-recall')
      } else {
        await token.unsetFlag(this.ID, this.FLAGS.SUPPRESS + `.${game.user.id}`)
        html.find('div[data-action=target]').removeClass('no-target-recall')
      }
    }
  }
}

export class recall{
  constructor(combatId, combatantId, userId) {
    this.combatantId = combatantId,
    this.combatId = combatId,
    this.userId = userId ? userId : game.user.id,
    this.targets = [[]],
    this.index = 0
  }

  get currentRoundTargets(){
    return this.targets[0].filter(t => this.validTargets.includes(t));
  }

  get hasCurrentTargets(){
    return this.currentRoundTargets.length ? true : false
  }

  get hasIndexTargets(){
    return this.indexTargets?.length ? true : false
  }

  get indexMax(){
    return this.targets.length - 1
  }

  get indexTargets(){
    return this.targets[this.index] ? this.targets[this.index].filter(t => this.validTargets.includes(t)) : []
  }

  get combatants(){
    return game.combats.get(this.combatId).combatants
  }

  get combatant(){
    return this.combatants.get(this.combatantId)
  }

  get token(){
    return canvas.tokens.get(this.combatant.token?.id)
  }

  get users(){
    return [game.users.find(gm => gm.isGM)?.id, this.userId]
  }

  get validTargets(){
    return this.combatants.filter(c => game.user.isGM || (!c.isDefeated && c.isVisible && !c.token.hidden)).map(c => c.token.id)
  }

  async save() {
    await this.combatant.setFlag(targetRecall.ID, targetRecall.FLAGS.TARGETRECALL, {[this.userId]:this})
  }

  async target() {
    this.targets.splice(0, 1, game.user.targets.ids);
    await this.save();
    targetRecall.log(false, 'recall target', {recall: this});
    this._ui(true);
  }

  _next(){
    targetRecall.log(false, 'next', {recall: this});
    if(this.hasIndexTargets && !canvas.scene.getEmbeddedDocument('Token', this.token.id).getFlag(targetRecall.ID, targetRecall.FLAGS.SUPPRESS + `.${game.user.id}`)){
      game.users.get(this.userId).updateTokenTargets(this.indexTargets);
      this._ui(false);
      return true
    } 
    return false
  }

  async set(){
    if(this.currentRoundTargets.length){
      if (this.targets.length > game.settings.get(targetRecall.ID, 'history')){this.targets.pop()}
      this.targets.unshift([]);
    }
    this.index = 0;
    await this.save();
  }

  async recall(past = true){
    if (!this.targets.length){return false}
    if (this.index <= 1){
      past ? this.index++ : this.index = this.indexMax
    } else if (this.index===this.indexMax)  {
      past ? this.index =  1 : this.index--
    } else {
      past ? this.index++: this.index--
    }
    await this.save();
    const result = this._next();
    return result
  }

  async _ui(current){
    if(!this.users.includes(game.user.id)) return
    Sequencer.EffectManager.endEffects({ origin: "target_recall_token_marker" })
    if(current && this.hasCurrentTargets){
      this._targetsNotify(this.currentRoundTargets)
      this._markTargets(this.currentRoundTargets)
    } else if(this.hasIndexTargets) {
      this._targetsNotify(this.indexTargets)
      this._markTargets(this.indexTargets)
    }
  }

  async _markTargets(targets){
    const file = game.settings.get(targetRecall.ID, 'marker');
    const dur = game.settings.get(targetRecall.ID, 'marker-duration');
    if(!file || !dur) return
    let s = new Sequence()
      for (const tokenId of targets) { 
        const token = canvas.scene.tokens.get(tokenId);
        s = s.effect()
            .file(file)
            .scale((game.settings.get(targetRecall.ID, 'marker-scale') * Math.max(token.data.height, token.data.width)))
            .opacity(.6)
            .origin('target_recall_token_marker')
            .duration(dur)
            .fadeOut(dur*.15)
            .attachTo(token)
            .belowTokens()
            .forUsers([this.userId, game.users.find(gm => gm.isGM)?.id])
      }
      s.play()
  }

  async _targetsNotify(targets){
    let innerHtml = ''; 
    const dim = canvas.scene.data.gridUnits;
    for(const tokenId of targets){
      const token = canvas.tokens.get(tokenId);
      const alias = game.settings.get(targetRecall.ID, 'finder-alias-suppress') ? '' : token.data.name ;
      innerHtml += `<li><img src="${token.data.img}"><span class="tr-ntfy-alias">${alias}</span><span class="tr-ntfy-dist">${getDistance(this.token, token)}${dim}</span></li>`;
    }
    window.targetRecall.targetDistance(`<ol>${innerHtml}</ol>`);
  }

}
