import {targetRecall} from "./target-recall.js";

Hooks.once('init', async function() { 
    const module = 'target-recall';
    const debouncedReload = foundry.utils.debounce(() => {
        window.location.reload();
      }, 100);

	game.settings.register(module, "active", {
		name: game.i18n.localize("TARGETRECALL.setting.active.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.active.description"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean
	});

    game.settings.register(module, "keybind", {
		name: game.i18n.localize("TARGETRECALL.setting.keybind.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.keybind.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
        onChange: debouncedReload
	});

    game.settings.register(module, "history", {
		name: game.i18n.localize("TARGETRECALL.setting.history.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.history.description"),
		scope: "world",
		config: true,
        default: 5,
        type: Number,
        range: {
            min: 1,
            max: 10,
            step: 1
        }
	});

    game.settings.register(module, "control", {
		name: game.i18n.localize("TARGETRECALL.setting.control.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.control.description"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});

    
    game.settings.register(module, "clear", {
		name: game.i18n.localize("TARGETRECALL.setting.clear.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.clear.description"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});

   
 });

 /**
  * Register debug flag with developer mode's custom hook
  */
 Hooks.once('ready',async function() {
    if(game.settings.get(targetRecall.ID, 'keybind')) {
        document.addEventListener("keydown", event => {    
            if(event.ctrlKey || event.metaKey){
                switch(event.key) {
                    case ",":
                        targetRecall.recall(true);
                        break;
                    case ".":
                        targetRecall.recall(false);
                        break;
                }
            }
        })
    }
 });
 
/**
 * Register debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(targetRecall.ID);
});

Hooks.on('targetToken', (user, token, targeted) => {
    if(user?.isSelf) {targetRecall.target()}
});

Hooks.on('controlToken', (token, controlled) => {
    if(controlled){targetRecall.target()}
});

Hooks.on('updateCombat', async (combat, round, time, combatId) => {
    if(!combat.started){return}
    let result;
    const token = canvas.tokens.get(combat.current.tokenId)
    if(combat.previous?.combatantId){
        await targetRecall.set(combat.id, combat.previous.combatantId)
    }
    if (token?.isOwner){
        if(combat.current?.combatantId){
            result = await targetRecall.recall(true, combat.id, combat.current.combatantId);
            if(!result){targetRecall.clear(game.user.id)}
        }
        if(game.settings.get(targetRecall.ID, "control")) {
            canvas.tokens.releaseAll();
            canvas.tokens.get(token.id).control();
        }
    }
});

Hooks.on('renderTokenHUD', (app, html, options) => {
    if(game.settings.get(targetRecall.ID, 'active')){
        const token = canvas.scene.getEmbeddedDocument('Token', options._id);
        if(token){
            token.getFlag(targetRecall.ID, targetRecall.FLAGS.SUPPRESS + `.${game.user.id}`) ? html.find('div[data-action=target]').addClass('no-target-recall') : html.find('div[data-action=target]').removeClass('no-target-recall')
            html.find('div[data-action=target]').mousedown(function(event) {
                if(event.which === 3 && options?._id){
                    targetRecall.tokenRecall(token, html)
                }
            }) 
        }  
    } 
});