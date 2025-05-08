let camCanvas = document.getElementById('webgl');
class Camera{
    constructor (){
        this.fov = 60;
        this.eye = new Vector3([0,0,2]);
        this.at = new Vector3([0, 0, 0]);
        this.up = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4().setLookAt(...this.eye.elements, ...this.at.elements, ...this.up.elements);
        this.projMatrix = new Matrix4().setPerspective(this.fov, camCanvas.width/camCanvas.height, 0.1, 1000);
    }

updateMatrices(){
        this.viewMatrix.setLookAt(...this.eye.elements, ...this.at.elements, ...this.up.elements);
        this.projMatrix.setPerspective(this.fov, camCanvas.width/camCanvas.height, 0.1, 1000);
    }

    moveForward(deltaTime){
        let speed = 1.5;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(speed * deltaTime);
        this.eye.add(f);
        this.at.add(f);
        this.updateMatrices();
    }

    moveBackwards(deltaTime){
        let speed = 1.5;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(speed * deltaTime);
        this.eye.sub(f);
        this.at.sub(f);
        this.updateMatrices();
    }

    moveLeft(deltaTime){
        let speed = 1.5;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(speed * deltaTime);
        this.eye.add(s);
        this.at.add(s);
        this.updateMatrices();
    }

    moveRight(deltaTime){
        let speed = 1.5;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(speed * deltaTime);
        this.eye.add(s);
        this.at.add(s);
        this.updateMatrices();
    }

    panLeft(deltaTime) {
        let alpha = 90;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha * deltaTime, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye)
        this.at.add(f_prime);
        this.updateMatrices();
    }

    panRight(deltaTime) {
        let alpha = 90;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-alpha * deltaTime, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye)
        this.at.add(f_prime);
        this.updateMatrices();
    }

    panUp(deltaTime) {
        let alpha = 90;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        let x = new Vector3()
        x.set(Vector3.cross(this.up, f));
        x.normalize();

        let rotationMatrix = new Matrix4();
        rotationMatrix.rotate(-alpha * deltaTime, x.elements[0], x.elements[1], x.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye)
        this.at.add(f_prime);
        this.updateMatrices();
    }

    panDown(deltaTime) {
        let alpha = 90;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        let x = new Vector3()
        x.set(Vector3.cross(this.up, f));
        x.normalize();

        let rotationMatrix = new Matrix4();
        rotationMatrix.rotate(alpha * deltaTime, x.elements[0], x.elements[1], x.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye)
        this.at.add(f_prime);
        this.updateMatrices();
    }

    panYawDegrees(angle) {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye)
        this.at.add(f_prime);
        this.updateMatrices();
    }

    panPitchDegrees(angle) {
        let clampAngle = 5;
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();

        if (Vector3.dot(f, this.up) > Math.cos(clampAngle * Math.PI/ 180) && angle > 0) {
            return;
        }

        if (Vector3.dot(f, this.up) < -1 * Math.cos(clampAngle * Math.PI/ 180) && angle < 0) {
            return;
        }

        let x = new Vector3()
        x.set(Vector3.cross(this.up, f));
        x.normalize();

        let rotationMatrix = new Matrix4();
        rotationMatrix.rotate(-angle, x.elements[0], x.elements[1], x.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye)
        this.at.add(f_prime);
        this.updateMatrices();
    }
   
}