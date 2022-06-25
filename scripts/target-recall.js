import{getDistance, setTargetGoverner, checkTargetGoverner} from './helpers.js';
import { targetRecallHasSequencer} from './index.js';

/**
 * A class which holds some constants
 */
export class targetRecall {
  constructor(combatId = '', combatantId = '', tokenId = '') {
    this.combatantId = combatantId,
    this.combatId = combatId,
    this.tokenId = tokenId;

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
    const c = canvas.scene.tokens.find(t => t.combatant && t.combatant.combat?.current?.combatantId === t.combatant.id && (t.isOwner || game.user.isGM))
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

  static async recallTargets(past = false, showUI = false, combatId = '', combatantId = '', tokenId = ''){
    if(!game.settings.get(targetRecall.ID, 'active')) return false
    const tr = new targetRecall(combatId, combatantId, tokenId)
    targetRecall.log(false, 'recallTargets', {'targetRecall': tr});
    const result = await tr.recall.recall(past, showUI)
    return result
  }

  static async set(combatId, combatantId, tokenId){
    const tr = new targetRecall(combatId, combatantId, tokenId)
    await tr.recall?.set()
    targetRecall.log(false, 'set', {'targetRecall': tr});
  }

  static async target() {
    const tr = new targetRecall()
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
    return this.userId// game.users.find(gm => gm.isGM)?.id === this.userId ? this.userId : [game.users.find(gm => gm.isGM)?.id, this.userId]
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
    targetRecall.log(false, 'target', {recall: this});
    this._ui(true);
  }

  async _next(showUI = false){
    let result = false;
    if(this.hasIndexTargets && !canvas.scene.getEmbeddedDocument('Token', this.token.id).getFlag(targetRecall.ID, targetRecall.FLAGS.SUPPRESS + `.${game.user.id}`)){
      game.users.get(this.userId).updateTokenTargets(this.indexTargets);
      this.targets.splice(0, 1, game.user.targets.ids);
      if(!game.settings.get(targetRecall.ID, "control") || showUI) this._ui(false);
      result = true
    } 
    await this.save();
    targetRecall.log(false, 'next', {recall: this, result: result});
    return result
  }

  async set(){
    if(this.currentRoundTargets.length){
      if (this.targets.length > game.settings.get(targetRecall.ID, 'history')){this.targets.pop()}
      this.targets.unshift([]);
    }
    this.index = 0;
    await this.save();
  }

  async recall(past = true, showUI = false){
    if (!this.targets.length){return false}
    if (this.index <= 1){
      past ? this.index++ : this.index = this.indexMax
    } else if (this.index===this.indexMax)  {
      past ? this.index =  1 : this.index--
    } else {
      past ? this.index++: this.index--
    }
    const result = await this._next(showUI);
    return result
  }

  async _ui(current){
    if(!this.users.includes(game.user.id)) return
    const id = setTargetGoverner(this.userId, this.token.id);
    if(!await checkTargetGoverner(id, this.userId, this.token.id)) return
    if(targetRecallHasSequencer) Sequencer.EffectManager.endEffects({ origin: "target_recall_token_marker" })
    if(current && this.hasCurrentTargets){
      this._targetsNotify(this.currentRoundTargets)
      this._markTargets(this.currentRoundTargets)
    } else if(!current && this.hasIndexTargets) {
      this._targetsNotify(this.indexTargets)
      this._markTargets(this.indexTargets)
    }
  }

  async _markTargets(targets){
    if(!targetRecallHasSequencer) return
    const file = game.settings.get(targetRecall.ID, 'marker');
    const dur = game.settings.get(targetRecall.ID, 'marker-duration');
    if(!file || !dur) return
    let s = new Sequence()
      for (const tokenId of targets) { 
        const token = canvas.scene.tokens.get(tokenId);
        s = s.effect()
            .file(file)
            .scale((game.settings.get(targetRecall.ID, 'marker-scale') * Math.max(token.height, token.width)))
            .opacity(.6)
            .origin('target_recall_token_marker')
            .duration(dur)
            .fadeOut(dur*.15, {ease: "linear", delay: 0})
            .attachTo(token, {bindVisibility:true})
            .belowTokens()
            .forUsers(this.users)
      }
      s.play()
  }

  async _targetsNotify(targets){
    let innerHtml = `<li><img src="${this.token.data.texture.src}"><span class="tr-crrt-alias">Distance from ${this.token.name}:</span></li>`; 
    const dim = canvas.scene.grid.units;
    for(const tokenId of targets){
      const token = canvas.tokens.get(tokenId);
      const alias = game.settings.get(targetRecall.ID, 'finder-alias-suppress') ? '' : token.name ;
      innerHtml += `<li><img src="${token.data.texture.src}"><span class="tr-ntfy-alias">${alias}</span><span class="tr-ntfy-dist">${getDistance(this.token, token)}${dim}</span></li>`;
    }
    window.targetRecall.targetDistance(`<ol>${innerHtml}</ol>`);
  }

}
