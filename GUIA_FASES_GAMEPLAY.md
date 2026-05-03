# Arquitectura de la Máquina de Estados (Gameplay)

El juego ahora cuenta con una arquitectura de **Fases** (Game Phases) que controla el flujo narrativo. Todo esto ocurre centralmente en el archivo `App.jsx`. 

El ciclo de juego principal dicta que el jugador desbloquea y avanza de fases conforme descifra los documentos ocultos. Al hacerlo, el sistema desbloquea nuevos cajones e inyecta nuevos Faxes.

## 1. El Estado Central (`gamePhase`)

En `App.jsx`, hemos introducido la variable maestra que dicta en qué acto de la historia estamos:
```javascript
const [gamePhase, setGamePhase] = useState(1);
```
Adicionalmente, los cajones ya no son estáticos; ahora son un Estado (`drawerData`). Esto significa que puedes modificar sus nombres, su contenido (documentos) o su estado de bloqueo (`isLocked`) en tiempo real mientras el juego corre.

## 2. ¿Cómo funciona la Máquina de Estados?

Justo debajo de la definición de estados en `App.jsx`, encontrarás un bloque `useEffect` marcado como `GAME STATE MACHINE`. 

Este bloque actúa como el "cerebro" del juego. Constantemente vigila qué documentos has descifrado:

```javascript
  // Fase 1 a Fase 2: Detectar si todos los documentos del Cajón 1 han sido descifrados
  useEffect(() => {
    if (gamePhase === 1) {
      const phase1Docs = INITIAL_DRAWERS[0].docs;
      
      // Verifica si TODOS los documentos del primer cajón ya están descifrados
      const allPhase1Deciphered = phase1Docs.every(doc => fullyDecipheredDocs.includes(doc));
      
      if (allPhase1Deciphered) {
        setGamePhase(2);
        
        // 1. Modificar el Archivero (Cajón 2 pasa a tener documentos)
        setDrawerData(prev => prev.map(d => {
          if (d.id === 2) {
            return { ...d, name: "CINTAS DE AUDIO Y REPORTES", docs: ['Cinta_01.docx'] };
          }
          return d;
        }));
        
        // 2. Aquí dispararás el Fax #2
      }
    }
  }, [fullyDecipheredDocs, gamePhase]);
```

## 3. Próximos Pasos Recomendados

Para terminar de construir tu narrativa, te sugiero seguir estos pasos en las próximas sesiones de programación:

### A. Hacer dinámico el sistema de Faxes (`FaxComponent`)
Actualmente el `FaxComponent` tiene el texto quemado (hardcoded). El siguiente paso será convertir el INBOX en un arreglo (array) de objetos.
```javascript
const [faxes, setFaxes] = useState([
  { id: 'mision_1', texto: 'BIENVENIDX...', leido: false }
]);
```
De esta forma, cuando pases a la Fase 2 o Fase 3, la máquina de estados simplemente hará:
`setFaxes(prev => [...prev, { id: 'mision_2', texto: 'Laboratorios Cerrados...' }])`. Esto hará que caiga un nuevo sobre físicamente en la bandeja INBOX del jugador.

### B. Transición de la Fase 2 a la Fase 3
De la misma forma que creamos el puente de Fase 1 a 2, crearás un bloque condicional para pasar a la 3:
```javascript
    if (gamePhase === 2) {
      // Condición: Si las cintas de audio y doc de cajón 2 están descifrados/enlazados
      if (cintasResueltas) {
        setGamePhase(3);
        // Quitar el candado del cajón 3
        setDrawerData(prev => prev.map(d => d.id === 3 ? { ...d, isLocked: false, name: "INSUMOS", docs: [...] } : d));
        // Enviar Fax 3 ("seguimos aquí, adentro") con la llave visual
      }
    }
```

### C. La condición de Victoria
Cuando `gamePhase === 3` y todos los insumos de este cajón hayan sido colocados y desencriptados, puedes hacer que se invoque en el escritorio o corcho el `Manifiesto de la avataridad.docx` final.

## 4. Notas sobre el Candado del Cajón 3

El componente `FilingCabinet.jsx` ahora respeta la propiedad `isLocked` de los objetos en `drawerData`. Si un cajón tiene `isLocked: true`, al intentar abrirlo se disparará una clase de CSS (`shake-locked`) que lo agitará bruscamente simulando que está trabado, y bloqueará su apertura física en el juego. 

Para desbloquear el cajón 3 (cuando llegue el fax de la llave en la Fase 3), tu máquina de estados solo tiene que cambiar `isLocked: false` en ese cajón específico, y el componente de la vista del archivero se actualizará instantáneamente eliminando el letrero rojo de BLOQUEADO y permitiendo al usuario jalarlo con el `3`.
