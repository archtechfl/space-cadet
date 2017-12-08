// JavaScript Document

(function threeApp () {

        var self = this;

        function setUpScene() {

            // Set up scene, camera, and light

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

            // Set camera position and target

            let cameraTarget = new THREE.Vector3( 0, 0, -200 );

            camera.position.z = 0;

            camera.lookAt(cameraTarget);

            let light = new THREE.PointLight( 0x777777, 2, 55 );
            light.position.set( 0, 0, 0 );
            scene.add( light );

            return {
                scene: scene,
                camera: camera,
                cameraTarget: cameraTarget,
                light: light
            }

        }

        var setUp = setUpScene();

        // Load camera and scene

        var camera = setUp.camera,
            scene = setUp.scene,
            cameraTarget = setUp.cameraTarget,
            light = setUp.light;

        var renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth - 300, window.innerHeight * 0.9 );

        function positionInstructions(renderer, self) {
            let instructions = document.getElementById("instructions");
            self.document.body.insertBefore(renderer.domElement, self.document.body.firstChild);
        }

        positionInstructions(renderer, self);

        function generateMaterials() {
            let tunnelMaterial = new THREE.MeshLambertMaterial( { color: 0xBABABA, side: THREE.DoubleSide } );
            let doorMaterial = new THREE.MeshLambertMaterial( { color: 0xFF0000, side: THREE.DoubleSide } );
            return {
                tunnel: tunnelMaterial,
                door: doorMaterial
            }
        }

        var materials = generateMaterials();

        var tunnelMaterial = materials.tunnel,
            doorMaterial = materials.door

        function buildTunnelBSP(width, height, depth, material, position) {
            let tunnelGeo = new THREE.CubeGeometry( width, height, depth, 8, 8, 8 );
            let tunnelMesh = new THREE.Mesh( tunnelGeo, material );
            tunnelMesh.position.set(position.x,position.y,position.z);
            var tunnel_bsp = new ThreeBSP( tunnelMesh );
            return {
                bsp: tunnel_bsp,
                mesh: tunnelMesh
            };
        }

        function buildGalleryBSP(height, length, width, material, position) {
            let galleryGeo = new THREE.CubeGeometry( height, length, width, 8, 8, 8 );
            let galleryMesh = new THREE.Mesh( galleryGeo, material );
            galleryMesh.position.set(position.x,position.y,position.z);
            let gallery_bsp = new ThreeBSP( galleryMesh );
            return {
                bsp: gallery_bsp,
                mesh: galleryMesh
            };
        }

        var galleryA = buildGalleryBSP(30, 30, 30, tunnelMaterial, {x: 0, y: 0, z: 0});
        var galleryB = buildGalleryBSP(30, 30, 30, tunnelMaterial, {x: 0, y: 0, z: -65});
        var tunnel = buildTunnelBSP(4, 4, 40, tunnelMaterial, {x: 0, y: 0, z: -35});
        var doorA = buildGalleryBSP(4, 4, 0.1, doorMaterial, {x: 0, y: 0, z: -14.95});

        var sceneArray = [
            galleryA.mesh,
            doorA.mesh
        ];

        // Create tunnel and other room

        function createRooms() {
            scene.remove(galleryA.mesh);
            galleryB = galleryB.bsp;
            tunnel = tunnel.bsp;
            galleryA = galleryA.bsp;
            var combined = galleryB.union(tunnel).union(galleryA);

            var combined_mesh = combined.toMesh( new THREE.MeshLambertMaterial({
                color: 0xBABABA,
                side: THREE.DoubleSide
            }));

            scene.add(combined_mesh);

        }

        scene.add( ...sceneArray );

        // Move the camera in the three dimensional space
        function controls ()
            {
                window.onkeyup = function(e) {
                    let key = e.keyCode ? e.keyCode : e.which;
                    // Get camera target
                    let targetPositionZ = cameraTarget.z;
                    let targetPositionX = cameraTarget.x;
                    let cameraPositionZ = camera.position.z;
                    let cameraPositionX = camera.position.x;
                    var cameraDirection = '';
                    // Figure out where the camera is pointing
                    if (targetPositionZ > cameraPositionZ) {
                        cameraDirection = "behind";
                    } else if (targetPositionZ < cameraPositionZ) {
                        cameraDirection = "ahead";
                    } else {
                        cameraDirection = "side";
                    }
                    switch (key) {
                        case 16:
                            if (doorA.mesh.position.y < 4 &&
                                ( (cameraPositionZ < doorA.mesh.position.z + 4) &&
                                ( cameraPositionZ > doorA.mesh.position.z - 4) )
                            ){
                                doorA.mesh.position.y += 4;
                                createRooms();
                            }
                            break;
                        case 40:
                            camera.position.y -= 1;
                            cameraTarget.y -= 1;
                            break;
                        case 38:
                            camera.position.y += 1;
                            cameraTarget.y += 1;
                            break;
                        case 37:
                            // Left arrow
                            if (cameraDirection === "ahead") {
                                camera.position.x -= 1;
                                cameraTarget.x -= 1;
                            } else if (cameraDirection === "behind") {
                                camera.position.x += 1;
                                cameraTarget.x += 1;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    camera.position.z -= 1;
                                    cameraTarget.z -= 1;
                                } else {
                                    // Looking x neg
                                    camera.position.z += 1;
                                    cameraTarget.z += 1;
                                }
                            }
                            break;
                        case 39:
                            // Right arrow
                            if (cameraDirection === "ahead") {
                                camera.position.x += 1;
                                cameraTarget.x += 1;
                            } else if (cameraDirection === "behind") {
                                camera.position.x -= 1;
                                cameraTarget.x -= 1;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    camera.position.z += 1;
                                    cameraTarget.z += 1;
                                } else {
                                    // Looking x neg
                                    camera.position.z -= 1;
                                    cameraTarget.z -= 1;
                                }
                            }
                            break;
                        case 65:
                            // A key (nominally "forward")
                            if (cameraDirection === "ahead") {
                                camera.position.z -= 1;
                                cameraTarget.z -= 1;
                            } else if (cameraDirection === "behind") {
                                camera.position.z += 1;
                                cameraTarget.z += 1;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    camera.position.x += 1;
                                    cameraTarget.x += 1;
                                } else {
                                    // Looking x neg
                                    camera.position.x -= 1;
                                    cameraTarget.x -= 1;
                                }
                            }
                            break;
                        case 90:
                            // W key (nominally "reverse")
                            if (cameraDirection === "ahead") {
                                camera.position.z += 1;
                                cameraTarget.z += 1;
                            } else if (cameraDirection === "behind") {
                                camera.position.z -= 1;
                                cameraTarget.z -= 1;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    camera.position.x -= 1;
                                    cameraTarget.x -= 1;
                                } else {
                                    // Looking x neg
                                    camera.position.x += 1;
                                    cameraTarget.x += 1;
                                }
                            }
                            break;
                        case 81:
                            // Rotate camera counterclockwise 90 degrees
                            console.log("Counterclockwise");
                            if (cameraDirection === "ahead") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX - 200;
                            } else if (cameraDirection === "behind") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX + 200;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    cameraTarget.z = cameraPositionZ - 200;
                                    cameraTarget.x = cameraPositionX;
                                } else {
                                    // Looking x neg
                                    cameraTarget.z = cameraPositionZ + 200;
                                    cameraTarget.x = cameraPositionX;
                                }
                            }
                            break;
                        case 87:
                            // Rotate camera clockwise 90 degrees
                            console.log("Clockwise");
                            if (cameraDirection === "ahead") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX + 200;
                            } else if (cameraDirection === "behind") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX - 200;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking right
                                    cameraTarget.z = cameraPositionZ + 200;
                                    cameraTarget.x = cameraPositionX;
                                } else {
                                    // Looking left
                                    cameraTarget.z = cameraPositionZ - 200;
                                    cameraTarget.x = cameraPositionX;
                                }
                            }
                            break;
                        default:
                            console.log(`key code is :${key}`);
                            break;
                    }
                    camera.lookAt(cameraTarget);
                    light.position.x = camera.position.x;
                    light.position.y = camera.position.y;
                    light.position.z = camera.position.z;
                }
            };

        function render()
            {
                requestAnimationFrame(render);

                controls();

                renderer.render(scene, camera);
            };

        render();

    })();