function randomName() {
    let abc = "qwertyuiopasdfghjklzxcvbnm";
    let str = []
    for (let i = 0; i < 2; i++) {
        str.push(abc[Math.floor(Math.random() * abc.length)])
    }
    return str.join("");
}
/**
 * For the ports
 * will be recieved via the position information of owner part.
 * vector v: The relative position of port according to G
 * vector u: The direction vector of port outwards
 * vector r: The rotation vector, which indicates the direction of 0 angle 
 * @param {THREE.Vector3} u
 * @param {THREE.Vector3} v
 * @param {THREE.Vector3} r
 */
function Port(v, u, r) {
    return {
        u: u,
        v: v,
        r: r
    }
}

function v3(x, y, z) {
    return new THREE.Vector3(x, y, z)
}


let partLoadingN = 3;
let objLoader = new THREE.OBJLoader();
let mtlLoader = new THREE.MTLLoader();


const partList = {
    RootPartBuilder: {
        id: -1,
        name: "RootPartBuilder",
        G: "./RootPart.obj",
        M: "./RootPart.mtl",
        portAmount: 1,
        portPD: [
            Port(v3(1.26919, 0, 0), v3(1, 0, 0), v3(0, 1, 0))
        ]
    },
    Hub: {
        id: 2,
        name: "Hub",
        G: "./Hub.obj",
        M: "./Hub.mtl",
        portAmount: 6,
        portPD: [
            Port(v3(-0.5, 0, 0), v3(-1, 0, 0), v3(0, -1, 0)),
            Port(v3(0.5, 0, 0), v3(1, 0, 0), v3(0, -1, 0)),
            Port(v3(0, 0, -0.5), v3(0, 0, -1), v3(-1, 0, 0)),
            Port(v3(0, 0, 0.5), v3(0, 0, 1), v3(-1, 0, 0)),
            Port(v3(0, 0.5, 0), v3(0, 1, 0), v3(-1, 0, 0)),
            Port(v3(0, -0.5, 0), v3(0, -1, 0), v3(-1, 0, 0))
        ],
    },
    StationModule: {
        id: 3,
        name: "StationModule",
        G: "./Station_Module.obj",
        M: "./Station_Module.mtl",
        portAmount: 2,
        portPD: [
            Port(v3(-1.12936, 0, 0), v3(-1, 0, 0), v3(0, -1, 0)),
            Port(v3(1.12936, 0, 0), v3(1, 0, 0), v3(0, -1, 0)),
        ],
    },
    SolarSquare: {
        id: 9,
        name: "SolarSqaure",
        G: "./Solar_Square.obj",
        M: "./Solar_Square.mtl",
        portAmount: 1,
        portPD: [Port(v3(-0.543223, 0, 0), v3(-1, 0, 0), v3(0, 1, 0))]
    }
}
function _loadMTL(name) {

    mtlLoader.load(partList[name].M, (material) => {
        console.log("Loaded Material: ", name, material)
        material.preload();
        _loadOBJ(name, material);
    },
        (xhr) => {
            console.log(`Loading MTL of ${name}`, xhr);
        },
        (error) => {
            console.error("Error has Occured : ", error);
            console.log(`Reloading ${name} MTL....`);
            _loadMTL(name);
        }
    )
}
function _loadOBJ(name, material) {
    objLoader.setMaterials(material);
    objLoader.load(partList[name].G, (object) => {
        console.log("Loaded: ", name, partLoadingN)
        partList[name].mesh = object.children[0].clone();
        partLoadingN--;
        if (partLoadingN == -1) {
            main();
        }
    },
        (xhr) => {
            console.log(`Loading OBJ of ${name}`, xhr);

        },
        (error) => {
            console.error("Error has Occured : ", error);
            console.log(`Reloading ${name} OBJ....`);
            _loadMTL(name, material);
        }
    )
}
function _loadModule(name) {
    _loadMTL(name);
}
function init() {

    objLoader.setPath("./asset/");
    mtlLoader.setPath("./asset/");
    for (const modulename in partList) {
        _loadModule(modulename)
    }
}
function main() {

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    const _q1 = new THREE.Quaternion();
    /**@type {Part} */
    let RootPart;


    let $$$ = {
        W: window.innerWidth,
        H: window.innerHeight * 0.9,
        nMID: -1,
        partN: 0,
        selectedPortUUID: "",
        selectedModule: "Hub",
        selectedPortID: 0,
        rotation: 0,
        /**@type {Part} */
        firstModule: undefined,
        part: [],
        _treeBuf: [],
        tree: () => {
            $$$._treeBuf = [];
            $$$._treeBuf.push(
                `module,0,${$$$.firstModule.partInfo.id}
name,${$$$.firstModule.name}
dock,${RootPart.port[0].connected.pid},builder
lights_int,1.0,1.0,1.0
lights_ext,1.0,1.0,1.0`
            )
            $$$.firstModule.visited = 1;
            for (const port of $$$.firstModule.port) {
                if (port.isOccupied && port.connected.part.visited == 0) {
                    $$$._tree(port);
                }
            }
            $$$.firstModule.visited = 0;
            return $$$._treeBuf.join(`\n`);
        },
        _tree: (hostPort) => {
            hostPort.connected.part.visited = 1;
            $$$._treeBuf.push(
                `module,${hostPort.connected.part.MID},${hostPort.connected.part.partInfo.id}
name,${hostPort.connected.part.name}
dock,${hostPort.connected.pid},${hostPort.part.MID},${hostPort.pid},${hostPort._rotation}
lights_int,1.0,1.0,1.0
lights_ext,1.0,1.0,1.0`
            )
            for (const port of hostPort.connected.part.port) {
                if (port.isOccupied && port.connected.part.visited == 0) {
                    $$$._tree(port);
                }
            }
            //
            hostPort.connected.part.visited = 0;
        },
        nodePart: null,
        attachNodeList: { root_0: null },
        attachNodeArray: [],
        addNode: (node) => {
            $$$.attachNodeList[node.uuid] = node;
            $$$.attachNodeArray.push(node);
        },
        connectMod(m1, m2, p1ind, p2ind) {
            m1.connected[p1ind] = m2;
            m2.connected[p2ind] = m1;
            m1.port[p1ind].connect(m2.port[p2ind])
            m2.port[p2ind].connect(m1.port[p1ind])
        }
    }

    let $UI = {
        idSelectionBox: document.getElementById('idsel-box'),
        button: {
            moduleSelect: {},
            blueprint: document.querySelector('button#button-blueprint'),
            blueprintCancel: document.querySelector("button#blueprintoutput-cancel")
        },
        range: {
            rotation: document.querySelector('input#angle-range')
        },
        text: {
            rotation: document.querySelector('span#angle-text'),
            partcount: document.querySelector('span#display-partcount')
        },
        uiGroup: {
            blueprint: document.querySelector("div#blueprint-ui"),
            /** @type {HTMLDivElement} */
            canvas: document.querySelector("div#WebGL-output"),
        },
        textarea: {
            blueprint: document.querySelector("textarea#blueprint-output"),
        },
        init: () => {
            $UI.range.rotation.value = 0;
            $UI.text.rotation.innerText = `0˚`
            for (const name in partList) {
                if (name != "RootPartBuilder") {
                    let dom = document.getElementById(`select-${name.toLowerCase()}`);
                    $UI.button.moduleSelect[name] = dom;
                    dom.disabled = false;
                    dom.addEventListener('click', (e) => {
                        $UI.updateModuleButtonUI(name);
                        $$$.selectedModule = name;
                        updateIDButton();
                        console.log(name);
                    })
                }
            }
            $UI.range.rotation.addEventListener('input', () => {
                $$$.rotation = parseFloat($UI.range.rotation.value) * 45;
                $UI.text.rotation.innerText = `${$$$.rotation}˚`
            })
            $UI.button.blueprint.addEventListener('click', () => {
                if ($$$.partN > 0) {
                    $UI.textarea.blueprint.innerHTML = $$$.tree();
                    $UI.uiGroup.blueprint.style.display = "block";
                }
                else {
                    alert("No part to write blueprint.")
                }
            })
            $UI.button.blueprintCancel.addEventListener('click', () => {
                $UI.uiGroup.blueprint.style.display = "none";
            })
        },
        selectButtonID: () => {
            //Nothing. yea nothing
        },
        updateModuleButtonUI: (nname) => {
            if (nname != $$$.selectedModule) {
                $UI.button.moduleSelect[nname].state = "selected";
                $UI.button.moduleSelect[nname].style.border = '3px solid red';
                $UI.button.moduleSelect[$$$.selectedModule].state = "none";
                $UI.button.moduleSelect[$$$.selectedModule].style.border = 'none';
            }
        }
    }
    $UI.init();

    class AttachNode extends THREE.Mesh {
        //static ATG = new THREE.OctahedronGeometry(0.4);
        //static ATT = new THREE.MeshBasicMaterial({ color: 0xffff00 })
        /**
         * 
         * @param {Part} part 
         * @param {THREE.Scene} scene 
         * @param {Number} portID 
         */
        constructor(part, scene, portID) {
            super(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial());
            this.pid = portID;
            this.material.color.copy(this.calcColor());
            this.portInfo = part.partInfo.portPD[portID]
            this.v = this.portInfo.v.clone();
            this.u = this.portInfo.u.clone();
            this.r = this.portInfo.r.clone();
            this.selected = 0;
            this.isAttachNode = 1;
            this.isOccupied = false;
            this._rotation = NaN;
            this.part = part;
            this.isSceneAddded = true;
            this.isRoot = false;
            this.connected = null;
            this.name = `${part.name}_${portID}`;
            this.recalibrate();
            //scene.add(new THREE.ArrowHelper(this.u,this.position,1,0xff0000))
            //this.visualize();
            scene.add(this)

        }
        calcColor() {
            return new THREE.Color(`hsl(${this.pid * 30},100%,50%)`)
        }
        visualize() {
            let uviewer = new THREE.ArrowHelper(this.u, this.position, 0.5);
            uviewer.setColor(this.calcColor())
            scene.add(uviewer);
            let rviewer = new THREE.ArrowHelper(this.r.clone(), this.position, 1);
            rviewer.setColor(new THREE.Color("white"))
            scene.add(rviewer)
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
            if (this.isOccupied && this.isSceneAddded) {
                this.isSceneAddded = false;
                scene.remove(this);
            }
            else if (!this.isOccupied && !this.isSceneAddded) {
                this.isSceneAddded = true;
                scene.add(this);
            }
        }
        recalibrate() {
            this.position.addVectors(this.part.mesh.position, this.v);
            for (let i = 0; i < 3; i++) {
                let v = this.u.getComponent(i)
                if (Math.abs(v - Math.round(v * 10e6) / 10e6) < 1E-10) {
                    this.u.setComponent(i, Math.round(v * 10e6) / 10e6)
                }
                v = this.r.getComponent(i)
                if (Math.abs(v - Math.round(v * 10e6) / 10e6) < 1E-10) {
                    this.r.setComponent(i, Math.round(v * 10e6) / 10e6)
                }
                v = this.v.getComponent(i)
                if (Math.abs(v - Math.round(v * 10e6) / 10e6) < 1E-10) {
                    this.v.setComponent(i, Math.round(v * 10e6) / 10e6)
                }
            }
        }
        connect(atNode) {
            this.isOccupied = true;
            this.connected = atNode;
            this._rotation = $$$.rotation;
        }
        makeRoot() {
            this.isRoot = true;
            //this.visible = false;
        }
        rotate(quaternion) {
            this.applyQuaternion(quaternion);
            this.v.applyQuaternion(quaternion);
            this.u.applyQuaternion(quaternion);
            this.r.applyQuaternion(quaternion);
            this.recalibrate();
        }
    }

    class Part {
        /**
         * 
         * @param {string} partName module name. ex)Corridor
         * @param {AttachNode} connected port that new module will attached to
         * @param {string} name name of this part. Default will 10-length random characters.
         */
        constructor(partName, connected, name = randomName()) {
            this.mesh = partList[partName].mesh.clone();
            this.MID = $$$.nMID++;
            //super(new THREE.BoxGeometry(1, 1, 1),  new THREE.MeshLambertMaterial({ color: Math.floor(Math.random() * 0xffffff) }));
            //this.mesh.wireframe = true;
            //this.material.uniformsNeedUpdate=true;
            //this.material.needsUpdate=true;
            this.partInfo = partList[partName];
            /**@type {Part[]} */
            this.connected = [];
            this.name = name;
            this.visited = false;
            /**@type {AttachNode[]} */
            this.port = [];
            scene.add(this.mesh);
            for (let i = 0; i < partList[partName].portPD.length; i++) {
                this.connected.push(-1);
                this.port[i] = new AttachNode(this, scene, i);
                $$$.addNode(this.port[i]);

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
            /**for (let i = 0; i < Part.partList[partName].portPD.length; i++) {
                if (this.name != "root") {
                    this.port[i].visualize();
                }
            }*/
        }
        visualize() {
            for (const port of this.port) {
                port.visualize()
            }
        }
        static init() {
            console.log("Generating...")
            RootPart = new Part("RootPartBuilder", null, "root");
            $$$.attachNodeList.root_0 = RootPart.port[0];
            $$$.attachNodeArray.push(RootPart.port[0]);
            RootPart.port[0].makeRoot();
            RootPart.visited = true;
            $UI.uiGroup.canvas.style.display = "block"
        }
    }
    Part.init();





   



    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
    renderer.shadowMapEnabled = true;
    document.getElementById('WebGL-output').appendChild(renderer.domElement)
    camera.position.set(10, 10, 10);
    camera.lookAt(scene.position);


    let controls = new THREE.TrackballControls(camera, renderer.domElement);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.staticMoving = true;
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
        //console.log($$$.selectedPortUUID)
        if (intersects.length > 0) {
            if (intersects[0].object.uuid != $$$.selectedPortUUID) {
                if ($$$.selectedPortUUID != "") {
                    $$$.attachNodeList[$$$.selectedPortUUID].selected = 0;
                    $$$.attachNodeList[$$$.selectedPortUUID].updateMat();
                }
                intersects[0].object.selected = 1;
                $$$.selectedPortUUID = intersects[0].object.uuid;
            }
            //console.log(intersects[0])
        }
        else {
            if ($$$.selectedPortUUID != "") {
                $$$.attachNodeList[$$$.selectedPortUUID].selected = 0;
                $$$.attachNodeList[$$$.selectedPortUUID].updateMat();
            }
            $$$.selectedPortUUID = "";
        }
        if ($$$.selectedPortUUID != "") $$$.attachNodeList[$$$.selectedPortUUID].updateMat();
    }
    /**
     * Function for adding new module if available AttachNode is clicked.
     */
    var clickEvent = () => {
        if ($$$.selectedPortUUID != "" && $$$.attachNodeList[$$$.selectedPortUUID].selected && !$$$.attachNodeList[$$$.selectedPortUUID].isOccupied) {
            let npart = new Part($$$.selectedModule, $$$.attachNodeList[$$$.selectedPortUUID]);
            $$$.partN++;
            $UI.text.partcount.innerHTML = `${$$$.partN} parts`
            //Original port
            let originalPort = $$$.attachNodeList[$$$.selectedPortUUID]
            //new port
            let newPort = npart.port[$$$.selectedPortID];
            originalPort.recalibrate();
            let u1 = originalPort.u.clone();
            let u2 = newPort.u.clone();
            let rotA = u1.clone().cross(u2).normalize();
            //console.log(originalPort.pid)
            if (!(rotA.x == 0 && rotA.y == 0 && rotA.z == 0)) {
                u1 = u1.negate().angleTo(u2);

                _q1.setFromAxisAngle(rotA, u1).normalize();
                console.log(u1 / Math.PI * 180, _q1.clone(), rotA.clone())
                npart.rotate(_q1);
                npart.mesh.applyQuaternion(_q1);
            }
            else if (u1.equals(u2)) {
                _q1.setFromUnitVectors(u1, u2.negate());
                npart.rotate(_q1);
                npart.mesh.applyQuaternion(_q1)
            }

            npart.recalibrate();
            u1 = originalPort.r.angleTo(newPort.r);
            rotA = originalPort.r.clone().cross(newPort.r)
            //console.log(u1)
            if (rotA.x == 0 && rotA.y == 0 && rotA.z == 0) {
                rotA = newPort.u
            }
            rotA.normalize();
            u1 = Math.PI - u1
            _q1.setFromAxisAngle(rotA, u1)
            npart.rotate(_q1);
            npart.mesh.applyQuaternion(_q1);
            _q1.setFromAxisAngle(originalPort.u, $$$.rotation / 180 * Math.PI);
            npart.rotate(_q1);
            npart.mesh.applyQuaternion(_q1);
            //originalPort.position+newPort.v.negate();
            npart.mesh.position.addVectors(originalPort.position, newPort.v.clone().negate());
            npart.recalibrate();
            npart.visualize();
            if (originalPort.isRoot) {
                $$$.firstModule = npart;
            }
            $$$.connectMod(originalPort.part, npart, originalPort.pid, $$$.selectedPortID);

        }
    }
    function updateIDButton() {
        $UI.idSelectionBox.replaceChildren();
        let n = partList[$$$.selectedModule].portAmount;
        let txt = document.createElement("td");
        txt.innerText = `Selected ID: ${$$$.selectedPortID}`
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
    /*var light = new THREE.PointLight(0xffffff);
    light.intensity = 1;
    light.position.set(100, 100, 100);
    scene.add(light);*/
    let light = new THREE.AmbientLight(0xffffff);
    light.intensity = 1.5;
    scene.add(light);


    renderer.render(scene, camera);

}
window.onload = init;