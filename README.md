A small module the captures a token's targets at turn end and recalls them on the token's next turn.

## Includes
1. Automated capture of targets at token's turn end. This is capture by user id, allowing for differentiation if more than one user is controlling the token.
2. Automated recall of targets from last turn on token's turn start.
3. Ability to scroll through target history using keybinds.
4. Option to disable target recall by user or by token.
5. Option to automatically select/take control of token at turn start, clearing any previous token (restricted to token owners).
6. Option to automatically clear targets at turn start for disabled users or tokens.

##Settings
Listed below are custom settings available for this module

### Keybinds
* Scroll through target history during combat by using CTRL+< (comma) or CTRL+> (period) on token's turn when token is selected.
* Keybinds can be disabled by GM within settings.

### Target History Rounds Retained
Set the amount of rounds to retain target history. Note, history is retained on the combatant, so will be deleted when the combat is ended.

### Enable Target Recall
* Client level setting that enables or disable Target Recall functionality.

### Select Token on Turn Start
* Selects owner's token on that token's turn, clearing any existing selected token's for that user. This option is available on several common modules so comes unselected to start.

### Clear Targets
* For tokens that do not have target recall enabled or that have no recall history, this setting will clear any current selected targets on the turn start. 
