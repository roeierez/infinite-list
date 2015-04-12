
var measuredFPS = 60,
    runAnimation = false;

function startAnimationLoop(step){
    var lastStepTime = new Date().getTime(),
        frames = 0;
    runAnimation = true;
    var animationStep = function(){
        var currentTime = new Date().getTime();
        frames++;
        if (currentTime - lastStepTime > 200) {
            measuredFPS = Math.min(60, 1000 * frames / (currentTime - lastStepTime));
            lastStepTime = currentTime;
            frames = 0;
        }
        step();
        if (runAnimation) {
            requestAnimationFrame(animationStep);
        }
    }
    requestAnimationFrame(animationStep);
}

function stopAnimationLoop(){
    runAnimation = false;
}

function getFPS(){
    return measuredFPS;
}

module.exports = {
    startAnimationLoop: startAnimationLoop,
    stopAnimationLoop: stopAnimationLoop,
    getFPS: getFPS
}
