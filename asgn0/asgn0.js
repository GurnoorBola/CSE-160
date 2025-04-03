const canvas = document.getElementById('example'); 
const ctx = canvas.getContext('2d');

function main() {  
  // Retrieve <canvas> element 
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  }
  const button1 = document.getElementById('Draw');
  const button2 = document.getElementById('Draw_op'); 
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, 'red');
  button1.addEventListener('click', handleDrawEvent);
  button2.addEventListener('click', handleDrawOperationEvent);
}


function drawVector(v, color){
  ctx.beginPath();
  var w = canvas.width/2;
  var h = canvas.height/2;
  ctx.moveTo(w, h);
  ctx.lineTo(w + v.elements[0]*20, h - v.elements[1]*20);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var v1 = new Vector3([parseFloat(document.getElementById('v1_x').value), parseFloat(document.getElementById('v1_y').value), 0]);
  drawVector(v1, 'red');
  var v2 = new Vector3([parseFloat(document.getElementById('v2_x').value), parseFloat(document.getElementById('v2_y').value), 0]);
  drawVector(v2, 'blue');
}

function handleDrawOperationEvent(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var v1 = new Vector3([parseFloat(document.getElementById('v1_x').value), parseFloat(document.getElementById('v1_y').value), 0])
  drawVector(v1, 'red');
  var v2 = new Vector3([parseFloat(document.getElementById('v2_x').value), parseFloat(document.getElementById('v2_y').value), 0])
  drawVector(v2, 'blue');
  var operation = document.getElementById('operation').value;
  v3 = new Vector3();
  if (operation == 'add'){
    v3 = v1;
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (operation == 'sub'){
    v3 = v1;
    v3.sub(v2);
    drawVector(v3, 'green');
  } else if (operation == 'mult'){
    v3 = v1
    v3.mul(parseFloat(document.getElementById('scalar').value))
    drawVector(v3, 'green');
    v3 = v2;
    v3.mul(parseFloat(document.getElementById('scalar').value))
    drawVector(v3, 'green')
  } else if (operation == 'div'){
    v3 = v1;
    v3.div(parseFloat(document.getElementById('scalar').value))
    drawVector(v3, 'green')
    v3 = v2;
    v3.div(parseFloat(document.getElementById('scalar').value))
    drawVector(v3, 'green')
  } else if (operation == 'mag'){
    v3 = v1;
    var m = v3.magnitude();
    console.log("Magnitude v1: " + m);
    v3 = v2;
    m = v3.magnitude();
    console.log("Magnitude v2: " + m);
  } else if (operation == 'norm'){
    v3 = v1;
    v3.normalize();
    drawVector(v3, 'green');
    v3 = v2;
    v3.normalize();
    drawVector(v3, 'green');
  } else if (operation == 'ang'){
    console.log('Angle: ' + angleBetween(v1, v2));
  } else if (operation == 'area'){
    console.log('Area of the triangle: ' + areaTriangle(v1, v2));
  }
}

function angleBetween(v1, v2){
  var d = Vector3.dot(v1, v2);
  var a = v1.magnitude();
  var b = v2.magnitude();
  angle = Math.acos(d/(a*b)) * (180/Math.PI);
  return angle;
}

function areaTriangle(v1, v2){
  v3 = Vector3.cross(v1, v2);
  var m = v3.magnitude();
  m /= 2;
  return m;
}