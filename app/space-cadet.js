// JavaScript Document

import * as THREE from 'three';
const ThreeBSP = require('../node_modules/three-js-csg/index.js')(THREE);

(function threeApp () {

        var self = this;

        function setUpScene() {

            // Set up scene, camera, and light

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

            // Set camera position and target

            let cameraTarget = new THREE.Vector3( 0, 0, -1 );

            camera.position.z = 0;

            camera.lookAt(cameraTarget);

            // Create a point light that will follow the camera position

            let lightDistance = 200;

            let light = new THREE.PointLight( 0x777777, 2, lightDistance );
            light.position.set( 0, 0, 0 );
            scene.add( light );

            return {
                scene: scene,
                camera: camera,
                cameraTarget: cameraTarget,
                light: light
            }

        }

        // Call scene setup

        var setUp = setUpScene();

        // Raycaster for collision detection

        var raycaster = new THREE.Raycaster();

        // Load camera and scene

        var camera = setUp.camera,
            scene = setUp.scene,
            cameraTarget = setUp.cameraTarget,
            light = setUp.light;

        var renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth - 300, window.innerHeight * 0.9 );

        // Position the instructions next to the newly created Canvas element that will show the rendered scene

        function positionInstructions(renderer) {
            let instructions = document.getElementById("instructions");
            document.body.insertBefore(renderer.domElement, document.body.firstChild);
        }

        positionInstructions(renderer);

        // Material factory: generates all materials that are used

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
            doorMaterial = materials.door;

        // Basic geometry factories

        var geoFaceComplexity = 2;

        function buildTunnelBSP(width, height, depth, material, position, faceComplexity, name) {
            let tunnelGeo = new THREE.CubeGeometry( width, height, depth, faceComplexity, faceComplexity, faceComplexity );
            let tunnelMesh = new THREE.Mesh( tunnelGeo, material );
            tunnelMesh.position.set(position.x,position.y,position.z);
            tunnelMesh.name = name;
            var tunnel_bsp = new ThreeBSP( tunnelMesh );
            return {
                bsp: tunnel_bsp,
                mesh: tunnelMesh
            };
        }

        function buildGalleryBSP(height, length, width, material, position, faceComplexity, name) {
            let galleryGeo = new THREE.CubeGeometry( height, length, width, faceComplexity, faceComplexity, faceComplexity );
            let galleryMesh = new THREE.Mesh( galleryGeo, material );
            galleryMesh.position.set(position.x,position.y,position.z);
            galleryMesh.name = name;
            let gallery_bsp = new ThreeBSP( galleryMesh );
            return {
                bsp: gallery_bsp,
                mesh: galleryMesh
            };
        }

        function buildGeometries(){
            let galleryA = buildGalleryBSP(30, 30, 30, tunnelMaterial, {x: 0, y: 0, z: 0}, geoFaceComplexity, "first chamber"),
                galleryB = buildGalleryBSP(30, 30, 30, tunnelMaterial, {x: 0, y: 0, z: -65}, geoFaceComplexity, "second chamber"),
                tunnel = buildTunnelBSP(4, 4, 40, tunnelMaterial, {x: 0, y: 0, z: -35}, 16, "first tunnel"),
                doorA = buildGalleryBSP(4, 4, 0.1, doorMaterial, {x: 0, y: 0, z: -14.95}, geoFaceComplexity, "first door");
            let group = new THREE.Group();
            group.add(
                galleryA.mesh,
                galleryB.mesh,
                tunnel.mesh,
                doorA.mesh
            );
            return group;
        }

        var geometries = buildGeometries();

        function buildFirstChamberScene(geometries) {
            let group = new THREE.Group();
            group.add(
                geometries.getObjectByName("first chamber"),
                geometries.getObjectByName("first door")
            )
            group.name = "maze";
            return group;
        }

        // Create tunnel and other room

        function createMaze() {
            let firstChamber = scene.getObjectByName("first chamber");
            let galleryB =  new ThreeBSP( geometries.getObjectByName("second chamber") );
            let tunnel = new ThreeBSP( geometries.getObjectByName("first tunnel") );
            let galleryA = new ThreeBSP( firstChamber );
            var combined = galleryB.union(tunnel).union(galleryA);

            let getInitialGroup = scene.getObjectByName("maze");

            getInitialGroup.remove(firstChamber);

            var combined_mesh = combined.toMesh( new THREE.MeshLambertMaterial({
                color: 0xBABABA,
                side: THREE.DoubleSide
            }));

            combined_mesh.name = "maze geometry";

            getInitialGroup.add(
                combined_mesh
            )

            scene.add(getInitialGroup);

            console.log("Maze created");
        }

        function retrieveFromScene(name){
            return scene.getObjectByName(name);
        }

        // Adds initial geometry to the scene

        scene.add( buildFirstChamberScene(geometries) );

        // Keep track of the door status
        var isDoorClosed = true;

        // Move the camera in the three dimensional space
        function controls ()
            {
                function determineCollision(rayMaster, scene, camera, axis, operation) {
                    // Cast a ray from the camera position in the direction of the intended movement, and check for any collision
                    var origin = camera.position.clone(),
                        environment = scene.children,
                        ray = rayMaster,
                        distance = null, // Vector for ray
                        destination = camera.position.clone(); // The future position
                    if (axis === "x") {
                        if (operation === "+") {
                            destination.setX( destination.x + 1 );
                        } else {
                            destination.setX( destination.x - 1 );
                        }
                    } else if (axis === "y") {
                        if (operation === "+") {
                            destination.setY( destination.y + 1 );
                        } else {
                            destination.setY( destination.y - 1 );
                        }
                    } else {
                        if (operation === "+") {
                            destination.setZ( destination.z + 1 );
                        } else {
                            destination.setZ( destination.z - 1 );
                        }
                    }
                    console.log(`
                        Origin z: ${origin.z},
                        Destination z: ${destination.z}
                    `);
                    // Raycast from camera to camera target
                    let directionVector = destination.sub( origin );
                    rayMaster.set( origin, directionVector.clone().normalize() );
                    scene.updateMatrixWorld();
                    // calculate objects intersecting the picking ray
                    var intersects = rayMaster.intersectObjects( scene.children, true );
                    // Distance holder
                    var distance = 15;
                    var collisionDetected = false;
                    if (intersects.length > 0) {
                        distance = intersects[0].distance;
                        console.log(distance);
                    }
                    if (distance <= 1) {
                        collisionDetected = true;
                    }
                    return collisionDetected;
                }
                // Keyboard control function
                window.onkeyup = function(e) {
                    // Read key
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
                    // Keyboard actions
                    switch (key) {
                        case 16:
                            // Load geometries for reference
                            const doorA = retrieveFromScene("first door");
                            if ( (cameraPositionZ < doorA.position.z + 4) && ( cameraPositionZ > doorA.position.z - 4) ){
                                // Only open door if it is closed
                                if (isDoorClosed) {
                                    doorA.position.y += 4;
                                    createMaze();
                                    isDoorClosed = false;
                                }
                            }
                            break;
                        case 40:
                            var collisionDetected = determineCollision(raycaster, scene, camera, "y", "-");
                            if (!collisionDetected){
                                camera.position.y -= 1;
                                cameraTarget.y -= 1;
                            }
                            break;
                        case 38:
                            var collisionDetected = determineCollision(raycaster, scene, camera, "y", "+");
                            if (!collisionDetected){
                                camera.position.y += 1;
                                cameraTarget.y += 1;
                            }
                            break;
                        case 37:
                            // Left arrow
                            if (cameraDirection === "ahead") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "x", "-");
                                if (!collisionDetected){
                                    camera.position.x -= 1;
                                    cameraTarget.x -= 1;
                                }
                            } else if (cameraDirection === "behind") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "x", "+");
                                if (!collisionDetected){
                                    camera.position.x += 1;
                                    cameraTarget.x += 1;
                                }
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "z", "-");
                                    if (!collisionDetected){
                                        camera.position.z -= 1;
                                        cameraTarget.z -= 1;
                                    }
                                } else {
                                    // Looking x neg
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "z", "+");
                                    if (!collisionDetected){
                                        camera.position.z += 1;
                                        cameraTarget.z += 1;
                                    }
                                }
                            }
                            break;
                        case 39:
                            // Right arrow
                            if (cameraDirection === "ahead") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "x", "+");
                                if (!collisionDetected){
                                    camera.position.x += 1;
                                    cameraTarget.x += 1;
                                }
                            } else if (cameraDirection === "behind") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "x", "-");
                                if (!collisionDetected){
                                    camera.position.x -= 1;
                                    cameraTarget.x -= 1;
                                }
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "z", "+");
                                    if (!collisionDetected){
                                    // Looking x pos
                                        camera.position.z += 1;
                                        cameraTarget.z += 1;
                                    }
                                } else {
                                    // Looking x neg
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "z", "-");
                                    if (!collisionDetected){
                                        camera.position.z -= 1;
                                        cameraTarget.z -= 1;
                                    }
                                }
                            }
                            break;
                        case 65:
                            // A key (nominally "forward")
                            if (cameraDirection === "ahead") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "z", "-");
                                if (!collisionDetected){
                                    camera.position.z -= 1;
                                    cameraTarget.z -= 1;
                                }
                            } else if (cameraDirection === "behind") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "z", "+");
                                if (!collisionDetected){
                                    camera.position.z += 1;
                                    cameraTarget.z += 1;
                                }
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "x", "+");
                                    if (!collisionDetected){
                                        camera.position.x += 1;
                                        cameraTarget.x += 1;
                                    }
                                } else {
                                    // Looking x neg
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "x", "-");
                                    if (!collisionDetected){
                                        camera.position.x -= 1;
                                        cameraTarget.x -= 1;
                                    }
                                }
                            }
                            break;
                        case 90:
                            // Z key (nominally "reverse")
                            if (cameraDirection === "ahead") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "z", "+");
                                if (!collisionDetected){
                                    camera.position.z += 1;
                                    cameraTarget.z += 1;
                                }
                            } else if (cameraDirection === "behind") {
                                var collisionDetected = determineCollision(raycaster, scene, camera, "z", "-");
                                if (!collisionDetected){
                                    camera.position.z -= 1;
                                    cameraTarget.z -= 1;
                                }
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "x", "-");
                                    if (!collisionDetected){
                                        camera.position.x -= 1;
                                        cameraTarget.x -= 1;
                                    }
                                } else {
                                    // Looking x neg
                                    var collisionDetected = determineCollision(raycaster, scene, camera, "x", "+");
                                    if (!collisionDetected){
                                        camera.position.x += 1;
                                        cameraTarget.x += 1;
                                    }
                                }
                            }
                            break;
                        case 81:
                            // Rotate camera counterclockwise 90 degrees (Q)
                            console.log("Counterclockwise");
                            if (cameraDirection === "ahead") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX - 1;
                            } else if (cameraDirection === "behind") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX + 1;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking x pos
                                    cameraTarget.z = cameraPositionZ - 1;
                                    cameraTarget.x = cameraPositionX;
                                } else {
                                    // Looking x neg
                                    cameraTarget.z = cameraPositionZ + 1;
                                    cameraTarget.x = cameraPositionX;
                                }
                            }
                            break;
                        case 87:
                            // Rotate camera clockwise 90 degrees (W)
                            console.log("Clockwise");
                            if (cameraDirection === "ahead") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX + 1;
                            } else if (cameraDirection === "behind") {
                                cameraTarget.z = cameraPositionZ;
                                cameraTarget.x = cameraPositionX - 1;
                            } else {
                                if (targetPositionX > cameraPositionX){
                                    // Looking right
                                    cameraTarget.z = cameraPositionZ + 1;
                                    cameraTarget.x = cameraPositionX;
                                } else {
                                    // Looking left
                                    cameraTarget.z = cameraPositionZ - 1;
                                    cameraTarget.x = cameraPositionX;
                                }
                            }
                            break;
                        case 219:
                            // Left bracket
                            var maze = retrieveFromScene("maze");
                            if (maze !== undefined){
                                maze.rotateY(0.5 * Math.PI);
                            }
                            break;
                        case 221:
                            // Right bracket
                            var maze = retrieveFromScene("maze");
                            if (maze !== undefined){
                                maze.rotateY(-0.5 * Math.PI);
                            }
                            break;
                        default:
                            console.log(`key code is :${key}`);
                            break;
                    }
                    camera.lookAt(cameraTarget);
                    // Move the light to the new camera position
                    light.position.x = camera.position.x;
                    light.position.y = camera.position.y;
                    light.position.z = camera.position.z;
                }
            };

        function render()
            {
                // Start the animation cycle (call render method 60 times a second)
                requestAnimationFrame(render);

                // Listen for any key movements and adjust the scene accordingly
                controls(scene);

                // Render the new scene
                renderer.render(scene, camera);
            };

        render();

    })();