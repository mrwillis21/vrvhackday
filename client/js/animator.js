// requestAnim shim layer by Paul Irish
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var Animator;
(function() {
  Animator = function(drawFunction) {
      this.draw = drawFunction;
      this.isStopped = true;
  }

  Animator.prototype.animate = function() {
      this.draw();
      if(!this.isStopped) {
          requestAnimFrame(this.animate.bind(this));
      }
  }

  Animator.prototype.startAnimation = function() {
      this.isStopped = false;
      this.animate();
  }

  Animator.prototype.stopAnimation = function() {
      this.isStopped = true;
  }
})();