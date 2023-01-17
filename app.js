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
 * vector r: The rotation vector, which indicates the direction of 0 angle 
 * @param {THREE.Vector3} u
 * @param {THREE.Vector3} v
 * @param {THREE.Vector3}
 */
function Port(v, u, r) {
    return {
        u: u,
        v: v,
        r: r
    }
}
function isParallelTo(v1, v2) {
    return v1.clone().normalize().equals(v2.clone().normalize())
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
    let RootPart;
    let partLoadingN = 3;

    let $$$ = {
        W: window.innerWidth,
        H: window.innerHeight * 0.9,
        partN: 0,
        selectedName: "",
        selectedModule: "Hub",
        selectedPortID: 0,
        rotation: 0,
        part: {},
        tree: (part) => {
            return
        },
        nodePart: null,
        attachNodeList: { root_0: null },
        attachNodeArray: [],
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



    class Part {
        static partList = {
            RootPartBuilder: {
                name: "RootPartBuilder",
                G: "./RootPart.obj",
                M: "./RootPart.mtl",
                portAmount: 1,
                portPD: [
                    Port(v3(1.26919, 0, 0), v3(1, 0, 0), v3(0, 1, 0))
                ]
            },
            Hub: {
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
            Corridor: {
                name: "Corridor",
                G: "./Station_Module.obj",
                M: "./Station_Module.mtl",
                portAmount: 2,
                portPD: [
                    Port(v3(-1.12936, 0, 0), v3(-1, 0, 0), v3(0, -1, 0)),
                    Port(v3(1.12936, 0, 0), v3(1, 0, 0), v3(0, -1, 0)),
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
                    Part.partList[name].mesh = object.children[0].clone();
                    partLoadingN--;
                    if (partLoadingN == 0) {
                        RootPart = new Part("RootPartBuilder", null, "root");
                        $$$.attachNodeList.root_0 = RootPart.port[0];
                        $$$.attachNodeArray.push(RootPart.port[0]);
                        RootPart.port[0].makeRoot();
                    }
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
            this.mesh.wireframe = true;
            //this.material.uniformsNeedUpdate=true;
            //this.material.needsUpdate=true;
            this.partInfo = Part.partList[partName];
            this.connected = [];
            this.name = name;
            this.visited = false;
            this.port = [];
            scene.add(this.mesh);
            for (let i = 0; i < Part.partList[partName].portPD.length; i++) {
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
            this.r = this.portInfo.r.clone();
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
            this.r.applyQuaternion(quaternion);
            this.position.addVectors(this.part.mesh.position, this.v)
            for (let i = 0; i < 3; i++) {
                let v = this.position.getComponent(i)
                if (Math.abs(v - Math.round(v)) < 1E-10) {
                    this.position.setComponent(i, Math.round(v))
                }
            }
        }
    }




    let $UI = {
        idSelectionBox: document.getElementById('idsel-box'),
        button: {
            moduleSelect: {},
            blueprint: document.querySelector('button#button-blueprint')
        },
        range: {
            rotation: document.querySelector('input#angle-range')
        },
        text: {
            rotation: document.querySelector('span#angle-text')
        },
        init: () => {
            $UI.range.rotation.value = 0;
            $UI.text.rotation.innerText = `0˚`
            for (const name of Object.keys(Part.partList)) {
                if (name != "RootPartBuilder") {
                    let dom = document.getElementById(`select-${name.toLowerCase()}`);
                    $UI.button.moduleSelect[name] = dom;
                    dom.addEventListener('click', (e) => {
                        $UI.updateModuleButtonUI(name);
                        $$$.selectedModule = name;
                        updateIDButton();
                        console.log(name);
                    })
                }
            }
            $UI.range.rotation.addEventListener('input', () => {
                $$$.rotation = $UI.range.rotation.value;
                $UI.text.rotation.innerText = `${$$$.rotation}˚`
            })
            $UI.button.blueprint.addEventListener('click', () => {

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

                //Original port
                let originalPort = $$$.attachNodeList[$$$.selectedName]
                //new port
                let newPort = npart.port[$$$.selectedPortID];
                originalPort.recalibrate();
                let u1 = originalPort.u.clone();
                let u2 = newPort.u.clone();
                let rotA = u1.clone().cross(u2);
                //console.log(originalPort.pid)
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

                npart.recalibrate();
                u1 = originalPort.r.angleTo(newPort.r);
                //console.log(u1)
                if (isParallelTo(originalPort.r, newPort.r)) {
                    rotA = newPort.u
                } else {
                    rotA = originalPort.r.clone().cross(newPort.r);
                }
                u1 = Math.PI - u1 + $$$.rotation
                _q1.setFromAxisAngle(rotA, u1);
                npart.rotate(_q1);
                npart.mesh.applyQuaternion(_q1);
                //originalPort.position+newPort.v.negate();
                npart.mesh.position.addVectors(originalPort.position, newPort.v.clone().negate());
                npart.recalibrate();
                npart.visualize();
                $$$.connectMod(originalPort.part, npart, originalPort.pid, $$$.selectedPortID);
            
        }
    }
    function updateIDButton() {
        $UI.idSelectionBox.replaceChildren();
        let n = Part.partList[$$$.selectedModule].portAmount;
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
    var light = new THREE.PointLight(0xffffff);
    light.intensity = 3;
    light.position.set(100, 100, 100);
    scene.add(light);


    renderer.render(scene, camera);

}
window.onload = init;