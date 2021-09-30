# Target Recall

A small Foundry VTT module that captures a token's targets at turn end and recalls them on the token's next turn.
<img src="https://user-images.githubusercontent.com/22696153/135372384-17a0ab9b-79dd-4b0a-948d-6d8d4ead7f71.gif" height="400">

shown here, as the GM toggles through their creatures' turns, the previous target for that creature is recalled. Shown at the GIF end is the keybind scroll functionality.

## Includes
1. Automated capture of the owner's current targets at token's turn end. This is captured by user id, allowing for differentiation if more than one user (e.g., the GM) is controlling the token.
2. Automated recall of targets from the previous turn on the token's turn start. Recall targets are targeted at turn start, unless that target is marked defeated.
3. Ability to scroll through target history using < and > keys along with CTRL.
4. Option to disable target recall by user or by token.
5. Option to automatically select/take control of an owned token at it's turn start, clearing any previously token currently selected by that user.
6. Option to automatically clear existing targets at turn start.

## HEADS UP - KNOWN CONFLICTS!!!
Several commonly installed modules _remove_ targets at the start of every round. These include: MidiQol, Combat Enhancements, Combat Booster, Monks Little Details, Combat Utility Belt. For each of these modules, this setting is optional. In order to token recall to actually target tokens automatically at the start of a round, you must update the settings for these modules so that they do not clear targets. Target Recall comes with a setting that clears targets which will accomodate the recall feature, so you can toggle that on in this module instead if you wish to continue to use it.

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

## Disable Target Recall on Individual Token
A user can disable Target Recall at the token level. This is applied just for the individual user. This allows a user to keep Target Recall enabled for other tokens while bypassing this token. To do this, right click on that token's target button within the token HUD - it's background will shade red.

<img src="https://user-images.githubusercontent.com/22696153/135369902-3f7513e5-59be-4916-b4c8-102b9eed0d60.png" height="400">
