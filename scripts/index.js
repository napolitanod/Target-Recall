import {targetRecall} from "./target-recall.js";
import {api} from './api.js';

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

    game.settings.register(module, "marker", {
        name: game.i18n.localize("TARGETRECALL.setting.marker.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.marker.description"),
        scope: "world",
        config: true,
        type: String,
        filePicker: "imagevideo"
    });

    game.settings.register(module, "marker-scale", {
        name: game.i18n.localize("TARGETRECALL.setting.marker.scale.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.marker.scale.description"),
        scope: "world",
        config: true,
        default: 1.0,
        type: Number,
        range: {
            min: 0.1,
            max: 10.0,
            step: 0.1
        }
    });

    game.settings.register(module, "marker-duration", {
        name: game.i18n.localize("TARGETRECALL.setting.marker.duration.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.marker.duration.description"),
        scope: "client",
        config: true,
        default: 4000,
        type: Number,
        range: {
            min: 0,
            max: 10000,
            step: 100
        }
    });

    game.settings.register(module, "finder-duration", {
        name: game.i18n.localize("TARGETRECALL.setting.finder.duration.label"),
        hint: game.i18n.localize("TARGETRECALL.setting.finder.duration.description"),
        scope: "client",
        config: true,
        default: 4000,
        type: Number,
        range: {
            min: 0,
            max: 10000,
            step: 100
        }
    });

    game.settings.register(module, "finder-alias-suppress", {
		name: game.i18n.localize("TARGETRECALL.setting.finder.alias-suppress.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.finder.alias-suppress.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean
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

    game.settings.register(module, "keybind", {
		name: game.i18n.localize("TARGETRECALL.setting.keybind.label"),
		hint: game.i18n.localize("TARGETRECALL.setting.keybind.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
        onChange: debouncedReload
	});

    if(game.settings.get(targetRecall.ID, 'keybind')) {
        const {SHIFT, CONTROL, ALT} = KeyboardManager.MODIFIER_KEYS;
        game.keybindings.register(targetRecall.ID, targetRecall.KEYBINDS.BACK, {
            name: "Scroll Target History Backward",
            hint: "Scrolls back through user's target history for the selected combatant.",
            uneditable: [
            {
                key: "Comma",
                modifiers: [ CONTROL]
            }
            ],
            onDown: () => {
                targetRecall.recallTargets(true); 
            },
            onUp: () => {},
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });

        game.keybindings.register(targetRecall.ID, targetRecall.KEYBINDS.FORWARD, {
            name: "Scroll Target History Forward",
            hint: "Scrolls forward through user's target history for the selected combatant.",
            uneditable: [
            {
                key: "Period",
                modifiers: [CONTROL]
            }
            ],
            onDown: () => {
                targetRecall.recallTargets(false); 
            },
            onUp: () => {},
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
    }
 });

 
Hooks.once('setup', async function() {
    api.register();
});

/**
 * Register debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(targetRecall.ID);
});

Hooks.on('targetToken', (user, token, targeted) => {
    targetRecall.log(false, 'targetToken', {isSelf: user?.isSelf});
    if(user?.isSelf) {targetRecall.target()}
});

Hooks.on('controlToken', (token, controlled) => {
    targetRecall.log(false, 'controlled', {controlled});
    if(controlled){targetRecall.target()}
});

Hooks.on('updateCombat', async (combat, round, time, combatId) => {
    if(!combat.started){return}
    const token = canvas.tokens.get(combat.current.tokenId)
    if(combat.previous?.combatantId){
        if (canvas.tokens.get(combat.previous.tokenId)?.isOwner) await targetRecall.set(combat.id, combat.previous.combatantId, combat.previous.tokenId)
    }
    if (token?.isOwner){
        if(combat.current?.combatantId){
            const result = await targetRecall.recallTargets(true, combat.id, combat.current.combatantId, token.id);
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