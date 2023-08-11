# DEVELOPER, TAKE ME OVER!!!!!
I have no time to enhance this module. If you are a Foundry user with developer skills or wanting to learn, I would love to pass this module code on to a new maintainer. Somebody that can give it the focus and love that I cannot!


![all versions](https://img.shields.io/github/downloads/napolitanod/Target-Recall/total) 
![Latest Release Download Count](https://img.shields.io/github/downloads/napolitanod/Target-Recall/latest/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ftarget-recall&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=target-recall)

# Target Recall

A small Foundry VTT module that captures a token's targets at turn end and recalls them on the token's next turn.
<img src="https://user-images.githubusercontent.com/22696153/147415399-5a0fc1b1-933f-411b-9496-8b3523e6f3c8.gif" height="500">


shown here, as the GM toggles through their creatures' turns, the previous target for that creature is recalled. Shown at the GIF end is the keybind scroll functionality.

## Includes
1. Automated capture of the owner's current targets at token's turn end. This is captured by user id, allowing for differentiation if more than one user (e.g., the GM) is controlling the token.
2. Automated recall of targets from the previous turn on the token's turn start. Recall targets are targeted at turn start, unless that target is marked defeated.
3. Ability to scroll through target history using < and > keys along with CTRL.
4. Option to disable target recall by user or by token.
5. Option to automatically select/take control of an owned token at it's turn start, clearing any previously token currently selected by that user.
6. Option to automatically clear existing targets at turn start.
7. Option to include temporary target markers for better location of targets on combatants turn.
8. Option to include termporary target distance finder window which displays the distance of all targets from combatant on combatants turn.

## HEADS UP - Other Modules with settings that will prevent target recall 
Several commonly installed modules have settings that, if enabled, will _remove_ targets at the start of every round. These include: MidiQol, Combat Enhancements, DnD5e Helpers, Monks Little Details, Next Up, Combat Utility Belt. For each of these modules, this setting is optional. In order to token recall to actually target tokens automatically at the start of a round, you must update the settings for these modules so that they do not clear targets. Target Recall comes with a setting that clears targets which will accomodate the recall feature, so you can toggle that on in this module instead if you wish to continue to use it.

## Settings
Listed below are custom settings available for this module

### Keybinds
Scroll through target history during combat by using CTRL+< (comma) or CTRL+> (period) on token's turn when token is selected. Keybinds can be disabled by GM within settings.

### Target History Rounds Retained
Set the amount of rounds to retain target history. Note, history is retained on the combatant, so will be deleted when the combat is ended.

### Enable Target Recall
Client level setting that enables or disable Target Recall functionality.

### Select Token on Turn Start
Selects owner's token on that token's turn, clearing any existing selected token's for that user. This option is available on several common modules so comes unselected to start.

### Clear Targets
For tokens that do not have target recall enabled or that have no recall history, this setting will clear any current selected targets on the turn start. 

### Target Marker
A target marker can be displayed on each targeted token. This marker only displays for the current combatant and only for that combatant's controller and the GM. This is a temporary marker which fades out after a set time in milliseconds, as set in the Foundry module configurations. To enable the target marker, use the file picker in module configuration under Target Recall in order to select a marker to use and then customize the scale and duration for the marker.

### Target FInder
A target finder window can be displayed in the bottom right area of the Foundry VTT canvas. This finder only displays for the current combatant and only for that combatant's controller. This is a temporary window which fades out after a set time in milliseconds, as set in the Foundry module configurations (to disable, set duration to 0). The target finder displays the list of targeted tokens, including token image, token alias, and distance from combatant. You may disable token alias name in the settings.

## Disable Target Recall on Individual Token
A user can disable Target Recall at the token level. This is applied just for the individual user. This allows a user to keep Target Recall enabled for other tokens while bypassing this token. To do this, right click on that token's target button within the token HUD - it's background will shade red.

<img src="https://user-images.githubusercontent.com/22696153/135369902-3f7513e5-59be-4916-b4c8-102b9eed0d60.png" height="400">
