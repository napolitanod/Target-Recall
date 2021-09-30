/**
 * A class which holds some constants
 */
export class targetRecall {
    static ID = 'target-recall';
    static NAME = 'targetRecall';
    
    static FLAGS = {
      TARGETRECALL: 'target-recall',
      SUPPRESS: 'suppress'
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

    static _toClass(flag){
      if(!flag?.combatantId){return {}}
      let r = new recall(flag.combatId, flag.combatantId, flag.userId);
      return mergeObject(r, flag, {insertKeys: false, enforceTypes: true})
    }

    static getRecall(combatId, combatantId, addNew = false){
      const t = game.combats.get(combatId)?.combatants.get(combatantId)?.getFlag(this.ID, this.FLAGS.TARGETRECALL + `.${game.user.id}`);
      return t ? targetRecall._toClass(t) : addNew ? new recall(combatId, combatantId) : false;
    }  

    static clear(userId, checkIf = true){
      if(checkIf && !game.settings.get(targetRecall.ID, "clear")) {return}
      game.users.get(userId).updateTokenTargets([])
    }

    static async target() {
      const userTokens = canvas.tokens.controlled;
      for(let i=0; i < userTokens.length; i++) {
        if(userTokens[i].combatant && userTokens[i].combatant.combat.current.combatantId === userTokens[i].combatant.id){
          await targetRecall.getRecall(userTokens[i].combatant.combat.id, userTokens[i].combatant.id, true).target();
          targetRecall.log(false, 'Current flags', userTokens[i].combatant.getFlag(this.ID, this.FLAGS.TARGETRECALL))
        }
      }
    } 

    static async set(combatId, combatantId){
      const r = targetRecall.getRecall(combatId, combatantId)
      if(r){await r.set()}
    }

    static async recall(past, combatId, combatantId){
      let token, result = false, r;
      if(!game.settings.get(targetRecall.ID, 'active')){return result}
      if(!combatId || !combatantId){
        token = canvas.tokens.controlled.find(t => t.combatant && t.combatant.combat?.current?.combatantId === t.combatant.id)
        r = token ? targetRecall.getRecall(token.combatant.combat.id, token.combatant.id) : false
      } else {
        r = targetRecall.getRecall(combatId, combatantId)
      }
      if(r) {result = await r.recall(past)}
      return result
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
    return this.targets[0];
  }
  
  get priorRoundTargets(){
    return this.targets[1];
  }

  get indexMax(){
    return this.targets.length - 1
  }

  get indexTargets(){
    return this.targets[this.index]
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

  async save() {
    await this.combatant.setFlag(targetRecall.ID, targetRecall.FLAGS.TARGETRECALL, {[this.userId]:this})
  }

  async target() {
    this.targets.splice(0, 1, game.user.targets.ids);
    await this.save();
  }

  _next(){
    targetRecall.log(false, 'next', {recall: this});
    const c = this.combatants.filter(c => !c.data.defeated).map(c => c.token.id);
    if(c && this.indexTargets?.length > 0 && !canvas.scene.getEmbeddedDocument('Token', this.token.id).getFlag(targetRecall.ID, targetRecall.FLAGS.SUPPRESS + `.${game.user.id}`)){
      game.users.get(this.userId).updateTokenTargets(this.indexTargets.filter(t => c.indexOf(t) !==-1));
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
    return this._next()
  }

}
