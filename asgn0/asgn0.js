const canvas = document.getElementById('example'); 
const ctx = canvas.getContext('2d');

function main() {  
  // Retrieve <canvas> element 
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  }
  const button = document.getElementById('Draw') 
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, 'red')
  button.addEventListener("click", handleDrawEvent)
}


function drawVector(v, color){
  ctx.beginPath();
  var w = canvas.width/2
  var h = canvas.height/2
  ctx.moveTo(w, h);
  ctx.lineTo(w + v.elements[0]*20, h - v.elements[1]*20);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var v1 = new Vector3([parseFloat(document.getElementById('v1_x').value), parseFloat(document.getElementById('v1_y').value), 0])
  drawVector(v1, 'red')
  var v2 = new Vector3([parseFloat(document.getElementById('v2_x').value), parseFloat(document.getElementById('v2_y').value), 0])
  drawVector(v2, 'blue')
}