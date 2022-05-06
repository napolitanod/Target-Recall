export function getDistance(orig, dest){
    const t1 = new PIXI.Point(...canvas.grid.getCenter(orig.x, orig.y));
    const t2 = new PIXI.Point(...canvas.grid.getCenter(dest.x, dest.y));
    const ray = new Ray(t1, t2);
    return canvas.grid.measureDistances([{ray:ray}], {gridSpaces: true})[0];
}

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

/*Helpers used to steady the redundancy of target hooks that fire on target*/
const govrnr = {};

export function setTargetGoverner(userId, tokenId){
    const id = foundry.utils.randomID(16);
    govrnr[userId] = {[tokenId]: id};
    return id;
}

export async function checkTargetGoverner(id, userId, tokenId){
    await wait(350);
    if(id === govrnr[userId][tokenId]) return true
    return false
}
/*End helpers used to steady the redundancy of target hooks that fire on target*/
