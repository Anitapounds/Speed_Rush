import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useOneChainAccount } from "../hooks/useOneChainAccount";
import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";
import { blockchainService } from "../services/blockchainService";
import type { NFTCar } from "../services/nftCarService";

interface SpeedRushGameProps {
  onExit?: () => void;
  selectedCar?: NFTCar | null;
}

const SpeedRushGame: React.FC<SpeedRushGameProps> = ({
  onExit,
  selectedCar,
}) => {
  const { connected, shortAddress, address } = useOneChainAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const carRef = useRef<THREE.Group | undefined>(undefined);
  const roadRef = useRef<THREE.Mesh | undefined>(undefined);
  const roadLinesRef = useRef<THREE.Mesh[]>([]);
  const obstaclesRef = useRef<THREE.Group[]>([]);
  const bonusBoxesRef = useRef<THREE.Group[]>([]);
  const goldenKeysRef = useRef<THREE.Group[]>([]);
  const invisibilityIndicatorRef = useRef<THREE.Mesh | undefined>(undefined);
  const animationIdRef = useRef<number | undefined>(undefined);

  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [gameRunning, setGameRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);
  const [popup, setPopup] = useState<{
    text: string;
    color: string;
    show: boolean;
  }>({
    text: "",
    color: "#ffffff",
    show: false,
  });

  const [gameStats, setGameStats] = useState({
    distance: 0,
    obstaclesAvoided: 0,
    bonusBoxesCollected: 0,
    gameStartTime: Date.now(),
  });

  const [speedyBalance, setSpeedyBalance] = useState<number>(0);
  const [tokensEarned, setTokensEarned] = useState<number | null>(null);
  const [isAwardingTokens, setIsAwardingTokens] = useState(false);
  const [tokensAlreadyClaimed, setTokensAlreadyClaimed] = useState(false);

  const gameStateRef = useRef({
    carPosition: 0,
    targetCarPosition: 0,
    baseGameSpeed: 0.008,
    speedMultiplier: 1.0,
    obstacleSpawnRate: 0.015,
    nextBonusThreshold: 70,
    invisibilityTimer: 0,
    gameStartTime: Date.now(),
    nextKeySpawnTime: 40,
    keySpawnInterval: 100,
  });

  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const showPopupMessage = useCallback(
    (text: string, color: string = "#ffffff") => {
      setPopup({ text, color, show: true });
      setTimeout(() => {
        setPopup((prev) => ({ ...prev, show: false }));
      }, 2000);
    },
    []
  );

  const loadSpeedyBalance = useCallback(async () => {
    if (!address) {
      setSpeedyBalance(0);
      return;
    }

    try {
      const balance = await blockchainService.getTokenBalance(address);
      setSpeedyBalance(balance);
    } catch (error) {
      console.error("Failed to load SPEEDY balance:", error);
      setSpeedyBalance(0);
    }
  }, [address]);

  const awardRaceTokens = useCallback(async () => {
    if (!connected || !address || isAwardingTokens || tokensAlreadyClaimed)
      return;

    try {
      setIsAwardingTokens(true);
      const tx = await blockchainService.awardRaceTokens(
        address,
        gameStats.distance,
        gameStats.obstaclesAvoided,
        gameStats.bonusBoxesCollected
      );

      const result = await signAndExecute({
        transaction: tx,
      });

      if (result && result.digest) {
        const distanceReward = Math.floor(gameStats.distance / 100) * 0.5;
        const obstacleReward = gameStats.obstaclesAvoided * 0.2;
        const bonusReward = gameStats.bonusBoxesCollected * 0.5;
        const completionBonus = 100;
        const totalTokens = Math.floor(
          distanceReward + obstacleReward + bonusReward + completionBonus
        );

        setTokensEarned(totalTokens);
        setTokensAlreadyClaimed(true);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        await loadSpeedyBalance();

        showPopupMessage(
          `🎉 Earned ${totalTokens} SPEEDY tokens! TX: ${result.digest.slice(
            0,
            8
          )}...`,
          "#ffd700"
        );
      }
    } catch (error) {
      console.error("Failed to award tokens:", error);
      showPopupMessage(
        "⚠️ Token reward failed - try claiming again",
        "#ff6666"
      );
    } finally {
      setIsAwardingTokens(false);
    }
  }, [
    connected,
    address,
    gameStats,
    signAndExecute,
    loadSpeedyBalance,
    showPopupMessage,
    isAwardingTokens,
    tokensAlreadyClaimed,
  ]);

  useEffect(() => {
    if (connected && address) {
      loadSpeedyBalance();
    }
  }, [connected, address, loadSpeedyBalance]);

  const createObstacle = useCallback((carZ: number) => {
    if (!sceneRef.current) return;

    const obstacleGroup = new THREE.Group();
    const obstacleType = Math.random();

    if (obstacleType < 0.4) {
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
      });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.y = 0.6;
      obstacle.castShadow = true;
      obstacleGroup.add(obstacle);
    } else if (obstacleType < 0.7) {
      const geometry = new THREE.ConeGeometry(0.6, 2);
      const material = new THREE.MeshLambertMaterial({ color: 0xff8800 });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.y = 1;
      obstacle.castShadow = true;
      obstacleGroup.add(obstacle);
    } else {
      const geometry = new THREE.SphereGeometry(0.8);
      const material = new THREE.MeshLambertMaterial({ color: 0x8844ff });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.y = 0.8;
      obstacle.castShadow = true;
      obstacleGroup.add(obstacle);
    }

    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const randomDistance = Math.random() * 300 + 50;
    obstacleGroup.position.set(lanes[laneIndex], 0, carZ - randomDistance);

    sceneRef.current.add(obstacleGroup);
    obstaclesRef.current.push(obstacleGroup);
  }, []);

  const createBonusBox = useCallback((carZ: number) => {
    if (!sceneRef.current) return;

    const bonusGroup = new THREE.Group();

    const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 0.75;
    box.castShadow = true;
    bonusGroup.add(box);

    const symbolGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6);
    const symbolMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
    symbol.position.y = 2.0;
    symbol.castShadow = true;
    bonusGroup.add(symbol);

    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const randomDistance = Math.random() * 200 + 100;
    bonusGroup.position.set(lanes[laneIndex], 0, carZ - randomDistance);

    sceneRef.current.add(bonusGroup);
    bonusBoxesRef.current.push(bonusGroup);
  }, []);

  const createGoldenKey = useCallback((carZ: number) => {
    if (!sceneRef.current) return;

    const keyGroup = new THREE.Group();

    const handleGeometry = new THREE.TorusGeometry(0.6, 0.15);
    const keyMaterial = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: 0x332200,
    });
    const handle = new THREE.Mesh(handleGeometry, keyMaterial);
    handle.position.y = 1;
    handle.castShadow = true;
    keyGroup.add(handle);

    const shaftGeometry = new THREE.BoxGeometry(0.2, 0.2, 1.5);
    const shaft = new THREE.Mesh(shaftGeometry, keyMaterial);
    shaft.position.set(0, 1, -0.75);
    shaft.castShadow = true;
    keyGroup.add(shaft);

    const teethGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const teeth1 = new THREE.Mesh(teethGeometry, keyMaterial);
    teeth1.position.set(0.15, 1, -1.35);
    teeth1.castShadow = true;
    keyGroup.add(teeth1);

    const teeth2 = new THREE.Mesh(teethGeometry, keyMaterial);
    teeth2.position.set(-0.15, 1, -1.15);
    teeth2.castShadow = true;
    keyGroup.add(teeth2);

    (keyGroup as any).userData = { rotationSpeed: 0.05 };

    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const randomDistance = Math.random() * 400 + 200;
    keyGroup.position.set(lanes[laneIndex], 0, carZ - randomDistance);

    sceneRef.current.add(keyGroup);
    goldenKeysRef.current.push(keyGroup);
  }, []);

  const activateInvisibility = useCallback(() => {
    setIsInvisible(true);

    const duration = 15000;
    gameStateRef.current.invisibilityTimer = duration;

    showPopupMessage("⚡ INVISIBLE MODE ACTIVATED ⚡", "#ffff00");

    if (invisibilityIndicatorRef.current) {
      invisibilityIndicatorRef.current.visible = true;
    }

    if (carRef.current) {
      carRef.current.children.forEach((child) => {
        if ((child as THREE.Mesh).material) {
          const material = (child as THREE.Mesh).material as THREE.Material;
          material.transparent = true;
          (material as any).opacity = 0.7;
        }
      });
    }
  }, [showPopupMessage]);

  const deactivateInvisibility = useCallback(() => {
    setIsInvisible(false);
    gameStateRef.current.invisibilityTimer = 0;
    showPopupMessage("INVISIBLE MODE OFF", "#ff6666");

    if (invisibilityIndicatorRef.current) {
      invisibilityIndicatorRef.current.visible = false;
    }

    if (carRef.current) {
      carRef.current.children.forEach((child) => {
        if ((child as THREE.Mesh).material) {
          const material = (child as THREE.Mesh).material as THREE.Material;
          material.transparent = false;
          (material as any).opacity = 1.0;
        }
      });
    }
  }, [showPopupMessage]);

  const init = useCallback(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x888888, 70, 150);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 12, 15);
    camera.lookAt(0, 0, -5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    const roadGeometry = new THREE.PlaneGeometry(12, 4000);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.01;
    road.position.z = -1000;
    road.receiveShadow = true;
    scene.add(road);
    roadRef.current = road;

    const roadLines: THREE.Mesh[] = [];
    const lineSpacing = 8;
    const lineLength = 4;
    const numLines = 500;

    for (let i = 0; i < numLines; i++) {
      const zPosition = i * lineSpacing - 2000;

      const lineGeometry = new THREE.PlaneGeometry(0.3, lineLength);
      const isSpecial = i % 10 === 0;
      const lineMaterial = new THREE.MeshLambertMaterial({
        color: isSpecial ? 0xffd700 : 0xffffff,
        transparent: false,
      });

      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.005, zPosition);
      scene.add(line);
      roadLines.push(line);

      const leftLine = new THREE.Mesh(
        lineGeometry.clone(),
        lineMaterial.clone()
      );
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.set(-3, 0.005, zPosition);
      scene.add(leftLine);
      roadLines.push(leftLine);

      const rightLine = new THREE.Mesh(
        lineGeometry.clone(),
        lineMaterial.clone()
      );
      rightLine.rotation.x = -Math.PI / 2;
      rightLine.position.set(3, 0.005, zPosition);
      scene.add(rightLine);
      roadLines.push(rightLine);
    }
    roadLinesRef.current = roadLines;

    const edgeGeometry = new THREE.BoxGeometry(0.5, 0.2, 4000);
    const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.position.set(-6.25, 0.05, -1000);
    scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.position.set(6.25, 0.05, -1000);
    scene.add(rightEdge);

    const carGroup = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(2.2, 0.6, 3);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0xff4444,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    carGroup.add(body);

    const roofGeometry = new THREE.BoxGeometry(1.8, 0.4, 1.5);
    const roofMaterial = new THREE.MeshLambertMaterial({
      color: 0xcc3333,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.2;
    roof.position.z = -0.2;
    roof.castShadow = true;
    carGroup.add(roof);

    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

    const wheelPositions: [number, number, number][] = [
      [-1.0, 0.3, 1.2],
      [1.0, 0.3, 1.2],
      [-1.0, 0.3, -1.2],
      [1.0, 0.3, -1.2],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    const indicatorGeometry = new THREE.SphereGeometry(0.3);
    const indicatorMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const invisibilityIndicator = new THREE.Mesh(
      indicatorGeometry,
      indicatorMaterial
    );
    invisibilityIndicator.position.set(0, 2, 0);
    invisibilityIndicator.visible = false;
    carGroup.add(invisibilityIndicator);
    invisibilityIndicatorRef.current = invisibilityIndicator;

    carGroup.position.set(0, 0, 8);
    scene.add(carGroup);
    carRef.current = carGroup;

    setGameStats({
      distance: 0,
      obstaclesAvoided: 0,
      bonusBoxesCollected: 0,
      gameStartTime: Date.now(),
    });
  }, []);

  const animate = useCallback(() => {
    if (
      !gameRunning ||
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !carRef.current
    ) {
      return;
    }

    const car = carRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const road = roadRef.current;
    const roadLines = roadLinesRef.current;

    if (keysRef.current.up) {
      gameStateRef.current.speedMultiplier = Math.min(
        2.0,
        gameStateRef.current.speedMultiplier + 0.02
      );
    }
    if (keysRef.current.down) {
      gameStateRef.current.speedMultiplier = Math.max(
        0.2,
        gameStateRef.current.speedMultiplier - 0.02
      );
    }

    const currentGameSpeed =
      gameStateRef.current.baseGameSpeed * gameStateRef.current.speedMultiplier;
    setSpeed(gameStateRef.current.speedMultiplier);

    if (isInvisible && gameStateRef.current.invisibilityTimer > 0) {
      gameStateRef.current.invisibilityTimer -= 16;
      if (invisibilityIndicatorRef.current) {
        invisibilityIndicatorRef.current.rotation.y += 0.1;
      }

      if (gameStateRef.current.invisibilityTimer <= 0) {
        deactivateInvisibility();
      }
    }

    car.position.z -= currentGameSpeed * 30;
    const newDistance = Math.floor(
      (Date.now() - gameStateRef.current.gameStartTime) / 100
    );
    setGameStats((prev) => ({ ...prev, distance: newDistance }));

    camera.position.z = car.position.z + 15;
    camera.lookAt(car.position.x, 0, car.position.z - 5);

    if (road) {
      road.position.z = car.position.z - 1000;
    }

    roadLines.forEach((line) => {
      if (line.position.z > car.position.z + 50) {
        line.position.z -= 4000;
      }
    });

    if (keysRef.current.left && gameStateRef.current.carPosition > -1) {
      gameStateRef.current.carPosition -= 0.08;
      gameStateRef.current.targetCarPosition = gameStateRef.current.carPosition;
    }
    if (keysRef.current.right && gameStateRef.current.carPosition < 1) {
      gameStateRef.current.carPosition += 0.08;
      gameStateRef.current.targetCarPosition = gameStateRef.current.carPosition;
    }

    if (
      Math.abs(
        gameStateRef.current.targetCarPosition -
          gameStateRef.current.carPosition
      ) > 0.01
    ) {
      const moveSpeed = 0.12;
      if (
        gameStateRef.current.targetCarPosition >
        gameStateRef.current.carPosition
      ) {
        gameStateRef.current.carPosition = Math.min(
          gameStateRef.current.targetCarPosition,
          gameStateRef.current.carPosition + moveSpeed
        );
      } else {
        gameStateRef.current.carPosition = Math.max(
          gameStateRef.current.targetCarPosition,
          gameStateRef.current.carPosition - moveSpeed
        );
      }
    }

    gameStateRef.current.carPosition = Math.max(
      -1,
      Math.min(1, gameStateRef.current.carPosition)
    );
    car.position.x = gameStateRef.current.carPosition * 4.5;

    if (Math.random() < gameStateRef.current.obstacleSpawnRate) {
      createObstacle(car.position.z);
    }

    if (score >= gameStateRef.current.nextBonusThreshold) {
      createBonusBox(car.position.z);
      gameStateRef.current.nextBonusThreshold += 70;
    }

    const currentTime = Date.now();
    const gameTimeElapsed =
      (currentTime - gameStateRef.current.gameStartTime) / 1000;

    if (gameTimeElapsed >= gameStateRef.current.nextKeySpawnTime) {
      createGoldenKey(car.position.z);
      gameStateRef.current.nextKeySpawnTime +=
        gameStateRef.current.keySpawnInterval;
    }

    goldenKeysRef.current.forEach((key) => {
      key.rotation.y += (key as any).userData.rotationSpeed;
    });

    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obstacle = obstaclesRef.current[i];

      if (obstacle.position.z > car.position.z + 10) {
        scene.remove(obstacle);
        obstaclesRef.current.splice(i, 1);
        setScore((prev) => prev + 5);
        setGameStats((prev) => ({
          ...prev,
          obstaclesAvoided: prev.obstaclesAvoided + 1,
        }));
      } else if (
        !isInvisible &&
        Math.abs(obstacle.position.z - car.position.z) < 2.5 &&
        Math.abs(obstacle.position.x - car.position.x) < 1.9
      ) {
        setGameOver(true);
        setGameRunning(false);

        return;
      }
    }

    for (let i = bonusBoxesRef.current.length - 1; i >= 0; i--) {
      const bonusBox = bonusBoxesRef.current[i];

      if (bonusBox.position.z > car.position.z + 10) {
        scene.remove(bonusBox);
        bonusBoxesRef.current.splice(i, 1);
      } else if (
        Math.abs(bonusBox.position.z - car.position.z) < 2.5 &&
        Math.abs(bonusBox.position.x - car.position.x) < 1.9
      ) {
        scene.remove(bonusBox);
        bonusBoxesRef.current.splice(i, 1);
        setScore((prev) => prev + 30);
        setGameStats((prev) => ({
          ...prev,
          bonusBoxesCollected: prev.bonusBoxesCollected + 1,
        }));
        showPopupMessage("🎁 +30 BONUS POINTS!", "#ffd700");
      }
    }

    for (let i = goldenKeysRef.current.length - 1; i >= 0; i--) {
      const key = goldenKeysRef.current[i];

      if (key.position.z > car.position.z + 10) {
        scene.remove(key);
        goldenKeysRef.current.splice(i, 1);
      } else if (
        Math.abs(key.position.z - car.position.z) < 2.5 &&
        Math.abs(key.position.x - car.position.x) < 1.9
      ) {
        scene.remove(key);
        goldenKeysRef.current.splice(i, 1);
        activateInvisibility();
      }
    }

    gameStateRef.current.baseGameSpeed += 0.000015;
    gameStateRef.current.obstacleSpawnRate = Math.min(
      0.04,
      gameStateRef.current.obstacleSpawnRate + 0.000008
    );

    renderer.render(scene, camera);
    animationIdRef.current = requestAnimationFrame(animate);
  }, [
    gameRunning,
    isInvisible,
    score,
    gameStats,
    createObstacle,
    createBonusBox,
    createGoldenKey,
    activateInvisibility,
    deactivateInvisibility,
    showPopupMessage,
    connected,
    awardRaceTokens,
  ]);

  const restartGame = useCallback(() => {
    if (sceneRef.current) {
      obstaclesRef.current.forEach((obstacle) =>
        sceneRef.current!.remove(obstacle)
      );
      bonusBoxesRef.current.forEach((box) => sceneRef.current!.remove(box));
      goldenKeysRef.current.forEach((key) => sceneRef.current!.remove(key));
    }

    obstaclesRef.current = [];
    bonusBoxesRef.current = [];
    goldenKeysRef.current = [];

    setScore(0);
    setSpeed(1.0);
    setGameRunning(true);
    setGameOver(false);
    setIsInvisible(false);
    setTokensEarned(null);
    setTokensAlreadyClaimed(false);

    gameStateRef.current = {
      carPosition: 0,
      targetCarPosition: 0,
      baseGameSpeed: 0.008,
      speedMultiplier: 1.0,
      obstacleSpawnRate: 0.015,
      nextBonusThreshold: 70,
      invisibilityTimer: 0,
      gameStartTime: Date.now(),
      nextKeySpawnTime: 40,
      keySpawnInterval: 100,
    };

    setGameStats({
      distance: 0,
      obstaclesAvoided: 0,
      bonusBoxesCollected: 0,
      gameStartTime: Date.now(),
    });

    if (carRef.current) {
      carRef.current.position.set(0, 0, 8);
    }

    if (roadRef.current) {
      roadRef.current.position.z = -1000;
    }

    const lineSpacing = 8;
    roadLinesRef.current.forEach((line, i) => {
      const lineIndex = Math.floor(i / 3);
      const zPosition = lineIndex * lineSpacing - 2000;
      line.position.z = zPosition;
    });

    deactivateInvisibility();
  }, [deactivateInvisibility]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = true;
          break;
        case "ArrowUp":
          keysRef.current.up = true;
          break;
        case "ArrowDown":
          keysRef.current.down = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = false;
          break;
        case "ArrowUp":
          keysRef.current.up = false;
          break;
        case "ArrowDown":
          keysRef.current.down = false;
          break;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!gameRunning || !rendererRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouseXNormalized =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseYNormalized =
        ((event.clientY - rect.top) / rect.height) * 2 - 1;

      gameStateRef.current.targetCarPosition = Math.max(
        -1,
        Math.min(1, mouseXNormalized)
      );
      gameStateRef.current.speedMultiplier = Math.max(
        0.2,
        Math.min(2.0, 1.0 - mouseYNormalized * 0.5)
      );
    };

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [gameRunning]);

  useEffect(() => {
    const timer = setTimeout(() => {
      init();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        try {
          if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      }
    };
  }, [init]);

  useEffect(() => {
    if (sceneRef.current && gameRunning) {
      animate();
    }
  }, [animate, gameRunning]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Game Canvas Container */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Top Bar */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          right: "20px",
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Exit Button */}
        {onExit && (
          <button
            onClick={onExit}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.85)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.7)";
            }}
          >
            ← Back to Menu
          </button>
        )}

        {/* Wallet Info */}
        {connected && shortAddress && (
          <div
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            🔗 {shortAddress}
          </div>
        )}
      </div>

      {/* Game UI - Modern Stats Panel */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "20px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "280px",
        }}
      >
        {/* Selected Car Card */}
        {selectedCar && (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#FFD700",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: "20px" }}>🏎️</span>
              <span>{selectedCar.name}</span>
            </div>
          </div>
        )}

        {/* Stats Card */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Score */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Score
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#fff",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {score.toLocaleString()}
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                Speed
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#4ECDC4",
                }}
              >
                {speed.toFixed(1)}x
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                Distance
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#FFE66D",
                }}
              >
                {gameStats.distance}m
              </div>
            </div>
          </div>
        </div>

        {connected && (
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.15))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 215, 0, 0.4)",
              borderRadius: "12px",
              padding: "14px 16px",
              boxShadow: "0 4px 20px rgba(255, 215, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "24px" }}>⚡</span>
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "2px",
                    }}
                  >
                    Claimed Speedy
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#FFD700",
                      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {speedyBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            {isAwardingTokens && (
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.7)",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "14px" }}>⏳</span>
                <span>Claiming tokens...</span>
              </div>
            )}
          </div>
        )}

        {isInvisible && (
          <div
            style={{
              background: "rgba(255, 255, 0, 0.2)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 255, 0, 0.6)",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(255, 255, 0, 0.3)",
              animation: "pulse 1s infinite",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "#FFFF00",
                fontSize: "16px",
                fontWeight: 700,
                textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
              }}
            >
              <span style={{ fontSize: "20px" }}>⚡</span>
              <span>INVISIBLE MODE</span>
              <span style={{ fontSize: "20px" }}>⚡</span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          zIndex: 100,
          color: "white",
          fontSize: "16px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        Use A/D or Arrow Keys to move • Up/Down arrows or mouse Y-axis to
        control speed
        <br />
        🔑 Golden keys = Invisibility power-up
      </div>

      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 200,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "40px",
            borderRadius: "20px",
            textAlign: "center",
            border: "3px solid #ffd700",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🏁</div>
          <h2 style={{ color: "#ffd700" }}>Game Over!</h2>
          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Final Score:</strong> {score.toLocaleString()}
            </p>
            <p>
              <strong>Distance:</strong> {gameStats.distance}m
            </p>
            <p>
              <strong>Obstacles Avoided:</strong> {gameStats.obstaclesAvoided}
            </p>
            <p>
              <strong>Bonuses Collected:</strong>{" "}
              {gameStats.bonusBoxesCollected}
            </p>

            {connected && tokensEarned !== null && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  background: "rgba(255, 215, 0, 0.2)",
                  borderRadius: "8px",
                  border: "2px solid #ffd700",
                }}
              >
                <p style={{ color: "#ffd700", fontSize: "20px", margin: 0 }}>
                  ⚡ <strong>+{tokensEarned} SPEEDY</strong> tokens earned!
                </p>
              </div>
            )}
            {connected && isAwardingTokens && (
              <div style={{ marginTop: "10px", color: "#ffd700" }}>
                <p>⏳ Awarding your SPEEDY tokens...</p>
              </div>
            )}
          </div>

          {connected && !tokensAlreadyClaimed && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "rgba(255, 215, 0, 0.1)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  color: "#ffd700",
                  fontSize: "16px",
                  marginBottom: "10px",
                }}
              >
                💰 Would you like to claim your SPEEDY tokens?
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={awardRaceTokens}
                  disabled={isAwardingTokens}
                  style={{
                    background: "linear-gradient(45deg, #28a745, #34ce57)",
                    border: "none",
                    color: "white",
                    padding: "12px 24px",
                    fontSize: "16px",
                    borderRadius: "8px",
                    cursor: isAwardingTokens ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    transition: "transform 0.2s",
                    flex: 1,
                    opacity: isAwardingTokens ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isAwardingTokens)
                      e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {isAwardingTokens ? "⏳ Claiming..." : "✅ Claim Tokens"}
                </button>
                <button
                  onClick={() => setTokensAlreadyClaimed(true)}
                  disabled={isAwardingTokens}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    padding: "12px 24px",
                    fontSize: "16px",
                    borderRadius: "8px",
                    cursor: isAwardingTokens ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    transition: "transform 0.2s",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isAwardingTokens)
                      e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  ⏭️ Skip
                </button>
              </div>
            </div>
          )}

          {tokensAlreadyClaimed && tokensEarned === null && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>
                ℹ️ You chose to skip claiming tokens for this race
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
            <button
              onClick={restartGame}
              style={{
                background: "linear-gradient(45deg, #ffd700, #ffed4e)",
                border: "none",
                color: "black",
                padding: "15px 30px",
                fontSize: "18px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "transform 0.2s",
                flex: 1,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              🏁 Race Again!
            </button>
            {onExit && (
              <button
                onClick={onExit}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  padding: "15px 30px",
                  fontSize: "18px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "transform 0.2s",
                  flex: 1,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                ← Main Menu
              </button>
            )}
          </div>
        </div>
      )}

      {popup.show && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 150,
            background: "rgba(0,0,0,0.9)",
            color: popup.color,
            padding: "20px 30px",
            borderRadius: "10px",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
            animation: "popupFade 2s ease-out",
            border: popup.color === "#ffd700" ? "2px solid #ffd700" : "none",
          }}
        >
          {popup.text}
        </div>
      )}

      <style>{`
                @keyframes popupFade {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                }
                
                @keyframes speedRushGlow {
                    0% { box-shadow: 0 0 5px #ffd700; }
                    50% { box-shadow: 0 0 20px #ffd700; }
                    100% { box-shadow: 0 0 5px #ffd700; }
                }
            `}</style>
    </div>
  );
};

export default SpeedRushGame;
