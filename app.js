function randomName() {
    let abc = "qwertyuiopasdfghjklzxcvbnm";
    let str = []
    for (let i = 0; i < 10; i++) {
        str.push(abc[Math.floor(Math.random() * abc.length)])
    }
    return str.join("");
}
/**
 * For the ports
 * will be recieved via the position information of owner part.
 * vector v: The relative position of port according to G
 * vector u: The direction vector of port outwards 
 * @param {THREE.Vector3} G
 * @param {THREE.Vector3} u
 * @param {THREE.Vector3} v
 */
function Port(v, u) {
    return {
        u: u,
        v: v
    }
}
function v3(x, y, z) {
    return new THREE.Vector3(x, y, z)
}
function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    let objLoader = new THREE.OBJLoader();
    let mtlLoader = new THREE.MTLLoader();
    const _q1 = new THREE.Quaternion();

    class Part {
        static partList = {
            Hub: {
                name: "Hub",
                G: "./Hub.obj",
                M: "./Hub.mtl",
                portAmount: 6,
                portPD: [
                    Port(v3(-0.5, 0, 0), v3(-1, 0, 0)),
                    Port(v3(0, -0.5, 0), v3(0, -1, 0)),
                    Port(v3(0, 0, -0.5), v3(0, 0, -1)),
                    Port(v3(0.5, 0, 0), v3(1, 0, 0)),
                    Port(v3(0, 0.5, 0), v3(0, 1, 0)),
                    Port(v3(0, 0, 0.5), v3(0, 0, 1))
                ],
            },
            Corridor: {
                name: "Corridor",
                G: "./Station_Module.obj",
                M: "./Station_Module.mtl",
                portAmount: 2,
                portPD: [
                    Port(v3(-1, 0, 0), v3(-1, 0, 0)),
                    Port(v3(1, 0, 0), v3(1, 0, 0)),
                ],
            }
        }
        static _loadModule(name) {
            mtlLoader.setPath("./asset/");
            mtlLoader.load(Part.partList[name].M, (material) => {
                material.preload();
                objLoader.setMaterials(material);
                objLoader.setPath("./asset/");
                objLoader.load(Part.partList[name].G, (object) => {
                    Part.partList[name].mesh=object.children[0].clone();
                },
                    (xhr) => {
                        console.log(`Loading OBJ of ${name}`, xhr);
                    },
                    (error) => {
                        console.error("Error has Occured : ", error);
                    }
                )
            },
                (xhr) => {
                    console.log(`Loading MTL of ${name}`, xhr);
                },
                (error) => {
                    console.error("Error has Occured : ", error);
                }
            )
        }
        static init() {
            for (const moduleName of Object.keys(Part.partList)) {
                Part._loadModule(moduleName);
            }
        }
        /**
         * 
         * @param {string} partName module name. ex)Corridor
         * @param {AttachNode} connected port that new module will attached to
         * @param {string} name name of this part. Default will 10-length random characters.
         */
        constructor(partName, connected, name = randomName()) {
            this.mesh = Part.partList[partName].mesh.clone();
            //super(new THREE.BoxGeometry(1, 1, 1),  new THREE.MeshLambertMaterial({ color: Math.floor(Math.random() * 0xffffff) }));
            this.mesh.material.wireframe = true;
            //this.material.uniformsNeedUpdate=true;
            //this.material.needsUpdate=true;
            this.partInfo = Part.partList[partName];
            this.connected = [];
            this.name = name;
            this.port = [];
            scene.add(this.mesh);
            for (let i = 0; i < Part.partList[partName].portPD.length; i++) {
                this.connected.push(-1);
                this.port[i] = new AttachNode(this, scene, i);
                $$$.addNode(this.port[i]);
                if (this.name != "root") {
                    this.port[i].visualize();
                }
            }

        }
        rotate(quaternion) {
            for (const port of this.port) {
                port.rotate(quaternion);
            }
        }
        recalibrate() {
            for (const port of this.port) {
                port.recalibrate();
            }
            for (let i = 0; i < Part.partList[partName].portPD.length; i++) {
                if (this.name != "root") {
                    this.port[i].visualize();
                }
            }
        }
    }
    Part.init();
    class AttachNode extends THREE.Mesh {
        //static ATG = new THREE.OctahedronGeometry(0.4);
        //static ATT = new THREE.MeshBasicMaterial({ color: 0xffff00 })
        constructor(part, scene, portID) {
            super(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial());
            this.pid = portID;
            this.material.color.copy(this.calcColor());
            this.portInfo = part.partInfo.portPD[portID]
            this.v = this.portInfo.v.clone();
            this.u = this.portInfo.u.clone();
            this.selected = 0;
            this.isAttachNode = 1;
            this.isOccupied = false;
            this.part = part;
            this.isRoot = false;
            this.connected = null;
            this.name = `${part.name}_${portID}`;
            this.recalibrate();
            //scene.add(new THREE.ArrowHelper(this.u,this.position,1,0xff0000))
            //this.visualize();
            scene.add(this)

        }
        calcColor() {
            return new THREE.Color(`hsl(${this.pid * 60},100%,50%)`)
        }
        visualize() {
            let uviewer = new THREE.ArrowHelper(this.u, this.position, 1);
            uviewer.setColor(this.calcColor())
            scene.add(uviewer);
            console.log(this.v, this)
            let vviewer = new THREE.ArrowHelper(this.v.clone().normalize(), this.part.position, this.v.length())
            vviewer.setColor(this.calcColor())
            scene.add(vviewer);
        }
        updateMat() {
            //this.visible=false;
            if (!this.isOccupied) {
                switch (this.selected) {
                    case 0:
                        //this.material.color.setHex(0xffff00);
                        this.material.color.copy(this.calcColor())
                        break;
                    case 1:
                        this.material.color.setHex(0x0000ff);
                        break;
                    case 2:
                        this.material.color.setHex(0xff0000);
                        break;
                }
            }
            else {
                this.material.color.setHex(0x0f0f0f)
            }
            this.visible = !this.isOccupied;
        }
        recalibrate() {
            this.position.addVectors(this.part.mesh.position, this.v);
            for (let i = 0; i < 3; i++) {
                let v = this.u.getComponent(i)
                if (Math.abs(v - Math.round(v)) < 1E-10) {
                    this.u.setComponent(i, Math.round(v))
                }
            }
        }
        connect(atNode) {
            this.isOccupied = true;
            this.connected = atNode;
        }
        makeRoot() {
            this.isRoot = true;
            //this.visible = false;
        }
        rotate(quaternion) {
            this.v.applyQuaternion(quaternion);
            this.u.applyQuaternion(quaternion);
            this.position.addVectors(this.part.mesh.position, this.v)
            for (let i = 0; i < 3; i++) {
                let v = this.position.getComponent(i)
                if (Math.abs(v - Math.round(v)) < 1E-10) {
                    this.position.setComponent(i, Math.round(v))
                }
            }
        }
    }

    class RootPart extends Part {
        static position = v3(0, 0, 0)
        static rotation = v3(0, 0, 0)
        static name = "root"
        static partInfo = {
            name: "root",
            G: null,
            M: null,
            portPD: [Port(v3(0, 0, 0), v3(1, 0, 0))]
        }
        static mesh={
            position:v3(0,0,0)
        }
        static port = new AttachNode(this, scene, 0)
    }


    let $UI = {
        idSelectionBox: document.getElementById('idsel-box'),
        button: {
            module_select: []
        },
        init: () => {
            for (const name of Object.keys(Part.partList)) {
                let dom = document.getElementById(`select-${name.toLowerCase()}`);
                $UI.button.module_select.push(dom);
                dom.addEventListener('click', (e) => {
                    $$$.selectedModule = name;
                    updateIDButton();
                    console.log(name);
                })
            }
        }
    }
    $UI.init();
    let $$$ = {
        W: window.innerWidth,
        H: window.innerHeight * 0.9,
        partN: 0,
        selectedName: "",
        selectedModule: "Hub",
        selectedPortID: 0,
        part: {},
        nodePart: null,
        attachNodeList: { root_0: RootPart.port },
        attachNodeArray: [RootPart.port],
        addNode: (node) => {
            $$$.attachNodeList[node.name] = node;
            $$$.attachNodeArray.push(node);
        },
        connectMod(m1, m2, p1ind, p2ind) {
            m1.connected[p1ind] = m2;
            m2.connected[p2ind] = m1;
            m1.port[p1ind].connect(m2.port[p2ind])
            m2.port[p2ind].connect(m1.port[p1ind])
        }
    }
    RootPart.port.makeRoot();

    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
    renderer.shadowMapEnabled = true;
    document.getElementById('WebGL-output').appendChild(renderer.domElement)
    camera.position.set(10, 10, 10);
    camera.lookAt(scene.position);


    let controls = new THREE.TrackballControls( camera, renderer.domElement );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.staticMoving=true;
    var clock = new THREE.Clock();
    function render() {
        var delta = clock.getDelta();
        controls.update(delta);
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    var axes = new THREE.AxesHelper(20);
    scene.add(axes);

    var mousemoveEvent = (e) => {
        let vector = new THREE.Vector3((e.clientX / $$$.W) * 2 - 1, -(e.clientY / $$$.H) * 2 + 1, 0.5);
        vector = vector.unproject(camera);
        let rc = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        let intersects = rc.intersectObjects($$$.attachNodeArray);
        //console.log($$$.selectedName)
        if (intersects.length > 0) {
            if (intersects[0].object.name != $$$.selectedName) {
                if ($$$.selectedName != "") {
                    $$$.attachNodeList[$$$.selectedName].selected = 0;
                    $$$.attachNodeList[$$$.selectedName].updateMat();
                }
                intersects[0].object.selected = 1;
                $$$.selectedName = intersects[0].object.name;
            }
            //console.log(intersects[0])
        }
        else {
            if ($$$.selectedName != "") {
                $$$.attachNodeList[$$$.selectedName].selected = 0;
                $$$.attachNodeList[$$$.selectedName].updateMat();
            }
            $$$.selectedName = "";
        }
        if ($$$.selectedName != "") $$$.attachNodeList[$$$.selectedName].updateMat();
    }

    var clickEvent = (e) => {
        if ($$$.selectedName != "" && $$$.attachNodeList[$$$.selectedName].selected == 1) {
            let npart = new Part($$$.selectedModule, $$$.attachNodeList[$$$.selectedName]);
            if ($$$.attachNodeList[$$$.selectedName].isRoot) {
                scene.add(npart.mesh);
            }
            else {
                //Original port
                let originalPort = $$$.attachNodeList[$$$.selectedName]
                //new port
                let newPort = npart.port[$$$.selectedPortID];
                originalPort.recalibrate();
                let u1 = originalPort.u.clone();
                let u2 = newPort.u.clone();
                let rotA = u1.clone().cross(u2);
                console.log(originalPort.pid)
                if (!(rotA.x == 0 && rotA.y == 0 && rotA.z == 0)) {
                    u1 = u1.negate().angleTo(u2);
                    _q1.setFromAxisAngle(rotA, u1);
                    npart.rotate(_q1);
                    npart.mesh.applyQuaternion(_q1);
                }
                else if (u1.equals(u2)) {
                    _q1.setFromUnitVectors(u1, u2.negate());
                    npart.rotate(_q1);
                    npart.mesh.applyQuaternion(_q1)
                }
                //originalPort.position+newPort.v.negate();
                npart.mesh.position.addVectors(originalPort.position, newPort.v.clone().negate());
                console.log(npart.position.toString())
                npart.recalibrate();
                $$$.connectMod(originalPort.part, npart, originalPort.pid, $$$.selectedPortID);
            }
        }
    }
    function updateIDButton() {
        $UI.idSelectionBox.replaceChildren();
        let n = Part.partList[$$$.selectedModule].portAmount;
        let txt = document.createElement("td");
        txt.innerText = `Selected ID: ${$$$.selectedPortID} Selected Module:${$$$.selectedModule}`
        for (let i = 0; i < n; i++) {
            let td = document.createElement('td');
            let btn = document.createElement('button');
            btn.addEventListener('click', () => {
                $$$.selectedPortID = i;
                txt.innerText = `Selected ID: ${i}`;
            })
            btn.innerText = i;
            td.appendChild(btn);
            $UI.idSelectionBox.appendChild(td);
        }
        $UI.idSelectionBox.appendChild(txt);
    }
    document.getElementById("WebGL-output").addEventListener('mousemove', mousemoveEvent);
    document.getElementById("WebGL-output").addEventListener('mousedown', clickEvent);
    updateIDButton();
    render();
    var light = new THREE.PointLight(0xffffff);
    light.intensity = 3;
    light.position.set(100, 100, 100);
    scene.add(light);


    renderer.render(scene, camera);

}
window.onload = init;