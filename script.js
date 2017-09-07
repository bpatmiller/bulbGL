'use strict';

function gui_object() {
  this.minimumStepDistance = 2;
  this.animate = true;
}

var gui_data = new gui_object();
var gui = new dat.GUI();
var ctrlPow = gui.add(gui_data,'minimumStepDistance',1,6,1).onChange(refresh);
var ctrlAnim = gui.add(gui_data,'animate').onChange(pause);

var container;
var camera, scene, renderer;
var uniforms;
var startTime;
var pauseTime;
var run;
var controls;

init();

var scalarMultiply = function(vec, scalar) {
  return new THREE.Vector3(vec.x*scalar,vec.y*scalar,vec.z*scalar);
}
var vectorAdd = function(vec1, vec2) {
  return new THREE.Vector3(vec1.x + vec2.x, vec1.y + vec2.y, vec1.z + vec2.z);
}

var vectorDiff = function(vec1, vec2) {
  return new THREE.Vector3(vec1.x - vec2.x, vec1.y - vec2.y, vec1.z - vec2.z);
}

var normalize = function(vec) {
  var norm = Math.sqrt(Math.pow(vec.x,2) + Math.pow(vec.y,2) + Math.pow(vec.z,2));
  return scalarMultiply(vec,Math.pow(norm,-1));
}
var norm = function(vec) {
  return Math.sqrt(Math.pow(vec.x,2) + Math.pow(vec.y,2) + Math.pow(vec.z,2));
}

var toSpherical = function(vec) {
  // in terms of r,theta,phi
  if(vec.y == 0 && vec.x == 0) {
    return new THREE.Vector3(norm(vec), 0, Math.acos(vec.z/norm(vec)));
  } else {
    return new THREE.Vector3(norm(vec), Math.atan2(vec.y ,vec.x) , Math.acos(vec.z/norm(vec)));
  }
}
var toRectangular = function(vec) {
  return new THREE.Vector3(vec.x * Math.sin(vec.z) * Math.cos(vec.y),
                  vec.x * Math.sin(vec.z) * Math.sin(vec.y),
                  vec.x * Math.cos(vec.z) );
}

var crossProduct = function(vec1, vec2) {
    return new THREE.Vector3(vec1.y*vec2.z - vec1.z*vec2.y,
                    vec1.z*vec2.x - vec1.x*vec2.z,
                    vec1.x*vec2.y - vec1.y*vec2.x);
}

// CONTROLLER STUFF //
//////////////////////
var dragStart = {x:0, y:0};
var viewStart;
var dragging = false;
var zooming = false;
var sideVector;
var topVector;
var viewVector;
var focusStart;
var speed = 0.05;

container.addEventListener("mousedown",function(event){
  eDragStart(event.pageX - container.offsetLeft, event.pageY - container.offsetTop)
},false);
document.addEventListener("mouseup",function(event){
  eDragEnd()
},false);
document.addEventListener("mousemove", function(event){
  eDrag(
    event.pageX - container.offsetLeft,
    event.pageY - container.offsetTop
  );
},false);
document.addEventListener("keydown",function(event){
  switch (event.keyCode) {
    case 87:
      // move the camera and the uniforms.focus.value forward along the view vector
      zooming = true;
      uniforms.camera.value = vectorAdd(uniforms.camera.value , scalarMultiply( normalize(new THREE.Vector3(uniforms.focus.value.x-uniforms.camera.value.x,uniforms.focus.value.y-uniforms.camera.value.y,uniforms.focus.value.z-uniforms.camera.value.z)), speed ) );
      refresh();
    break;
    case 83:
      // reverse
      zooming = true;
      uniforms.camera.value = vectorAdd(uniforms.camera.value , scalarMultiply( normalize(new THREE.Vector3(uniforms.focus.value.x-uniforms.camera.value.x,uniforms.focus.value.y-uniforms.camera.value.y,uniforms.focus.value.z-uniforms.camera.value.z)), 0-speed ) );
      refresh();
    break;
    case 37:
      // left rotate
      dragging = true;
      viewVector = new THREE.Vector3(uniforms.focus.value.x-uniforms.camera.value.x, uniforms.focus.value.y-uniforms.camera.value.y, uniforms.focus.value.z-uniforms.camera.value.z);
      topVector = toSpherical(viewVector);
      topVector.z += Math.PI/2;
      topVector=normalize(toRectangular(topVector));
      sideVector = normalize(crossProduct(viewVector,topVector));
      uniforms.camera.value = vectorAdd(uniforms.camera.value, scalarMultiply(normalize(sideVector), 0-speed))
      refresh();
      break;
    case 39:
      // right rotate
      dragging = true;
      viewVector = new THREE.Vector3(uniforms.focus.value.x-uniforms.camera.value.x, uniforms.focus.value.y-uniforms.camera.value.y, uniforms.focus.value.z-uniforms.camera.value.z);
      topVector = toSpherical(viewVector);
      topVector.z += Math.PI/2;
      topVector=normalize(toRectangular(topVector));
      sideVector = normalize(crossProduct(viewVector,topVector));
      uniforms.camera.value = vectorAdd(uniforms.camera.value, scalarMultiply(normalize(sideVector), speed))
      refresh();
      break;
    case 38:
      // up rotate
      dragging = true;
      viewVector = new THREE.Vector3(uniforms.focus.value.x-uniforms.camera.value.x, uniforms.focus.value.y-uniforms.camera.value.y, uniforms.focus.value.z-uniforms.camera.value.z);
      topVector = toSpherical(viewVector);
      topVector.z += Math.PI/2;
      topVector=normalize(toRectangular(topVector));
      sideVector = normalize(crossProduct(viewVector,topVector));
      uniforms.camera.value = vectorAdd(uniforms.camera.value, scalarMultiply(normalize(topVector), 0-speed))
      refresh();
      break;
    case 40:
      // down rotate
      dragging = true;
      viewVector = new THREE.Vector3(uniforms.focus.value.x-uniforms.camera.value.x, uniforms.focus.value.y-uniforms.camera.value.y, uniforms.focus.value.z-uniforms.camera.value.z);
      topVector = toSpherical(viewVector);
      topVector.z += Math.PI/2;
      topVector=normalize(toRectangular(topVector));
      sideVector = normalize(crossProduct(viewVector,topVector));
      uniforms.camera.value = vectorAdd(uniforms.camera.value, scalarMultiply(normalize(topVector), speed))
      refresh();
      break;
  }
},false);

document.addEventListener("keyup",function(event){
  dragging = false;
  zooming = false;
},false);

function eDragStart(x,y) {
  dragStart.x = x;
  dragStart.y = y;
  focusStart = uniforms.focus.value;
  topVector = toSpherical(vectorDiff( uniforms.focus.value,uniforms.camera.value ));
  topVector.z += Math.PI/2;

  topVector=normalize(toRectangular(topVector));
  sideVector = normalize(crossProduct(vectorDiff(focusStart,uniforms.camera.value),topVector));
  dragging = true;
}

function eDragEnd() {
  dragging = false;
}

function eDrag(x,y) {
  if (dragging) {
    var diffVector = vectorAdd(scalarMultiply(sideVector, (dragStart.x - x)*speed ),
                               scalarMultiply(topVector,  (dragStart.y - y)*speed ));
    uniforms.focus.value = vectorAdd( focusStart, diffVector );
    refresh();
  }
}
// END CONTROLLER STUFF //
//////////////////////////




animate();

function refresh() {
  if(! gui_data.animate) {
    startTime = startTime + (Date.now() - pauseTime);
    pauseTime = Date.now();
    render();
  }
}


function pause() {
  if(gui_data.animate) {
    startTime = startTime + (Date.now() - pauseTime); 
    animate();
  } else {
    pauseTime = Date.now()
  }
}

function init() {

  container = document.getElementById( 'container' );

  startTime = Date.now();
  camera = new THREE.Camera();
  camera.position.z = 1;

  scene = new THREE.Scene();

  var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

  uniforms = {
    iGlobalTime: { type: "f", value: 1.0 },
    iResolution: { type: "v2", value: new THREE.Vector2() },
    minimumStepDistance: { type: "f", value: Math.pow(10,(-1)*gui_data.minimumStepDistance) },
    camera: { type: "v3", value: new THREE.Vector3(2.0,1.0,1.0) },
    focus: { type: "v3", value: new THREE.Vector3(0.0,0.0,0.0) }
  };

  var material = new THREE.ShaderMaterial( {

    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent

  } );

  var mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer = new THREE.WebGLRenderer();
  container.appendChild( renderer.domElement );

  onWindowResize();

  window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize( event ) {

  var dim = Math.min(window.innerWidth,window.innerHeight);
  uniforms.iResolution.value.x = dim;
  uniforms.iResolution.value.y = dim;

  renderer.setSize(dim,dim );
  

}

function animate() {

  if(gui_data.animate) {
    run = requestAnimationFrame( animate );
    render();
  }

}

function render() {

  var currentTime = Date.now();
  uniforms.iGlobalTime.value = (currentTime - startTime) * 0.001;
  uniforms.minimumStepDistance.value = Math.pow(10,(-1)*gui_data.minimumStepDistance);
  renderer.render( scene, camera );

}
