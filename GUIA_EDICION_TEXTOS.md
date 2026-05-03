# Guía de Edición de Textos - Dossier Interactivo

Esta guía te explica cómo y dónde puedes modificar los textos, documentos, palabras clave y otros contenidos del juego sin tener que preocuparte por romper la lógica del código.

---

## 1. Documentos del Archivero (Los textos con partes ocultas)
**Archivo a modificar:** `src/data/documents.json`

Este archivo contiene el texto de cada documento de investigación. Está en formato JSON.
- **Estructura:** Cada documento tiene un nombre de archivo (ej. `"Observación LOTERÍA.docx"`) y dentro tiene un arreglo (lista) de "páginas", y cada página tiene un arreglo de "párrafos".
- **Cómo editar:** Puedes cambiar los textos entre las comillas. Si quieres añadir un nuevo párrafo, simplemente agrega otra cadena de texto separada por comas dentro de los corchetes de la página.

---

## 2. Palabras Ocultas (El mecanismo de censura)
**Archivo a modificar:** `src/components/RedactedDossier.jsx`
**Líneas:** 7 a 15

El sistema utiliza un diccionario llamado `conceptMapping` para saber qué palabras censurar en el texto y qué concepto del glosario se requiere para destaparlas. 

```javascript
export const conceptMapping = {
  "Videojuegos": /videojuegos?/i,
  "Juego": /juegos?|jugar|juegan?|jugamos|jugadores?/i,
  "Universo": /universos?|mundos?/i,
  "Avatarización": /avatar(?:es)?|avataridad|avatarizaci[oó]n/i,
  "Partida": /partidas?/i
};
```
- **Cómo editar:** 
  1. A la izquierda (entre comillas) va el nombre EXACTO del concepto en el Glosario (con su mayúscula y acentos).
  2. A la derecha (entre barras `/.../i`) van las variantes de la palabra en el texto.
  3. Puedes añadir nuevas líneas siguiendo ese mismo formato. El símbolo `|` significa "O", y la `s?` significa que la letra "s" es opcional.
- **¡Ya no necesitas modificar reglas extrañas de validación!** El sistema ahora une la palabra y el concepto automáticamente. Al destapar un concepto, se destaparán mágicamente TODAS las demás palabras vinculadas a ese concepto en todos los documentos.

---

## 3. El Glosario (Definiciones y Conceptos)
**Archivo a modificar:** `src/components/Glossary.jsx`
**Líneas:** 6 a 19

Aquí se encuentra la variable `glossaryPages`. El glosario está dividido en páginas (cada arreglo `[]` interno representa una página que tiene dos conceptos).
- **Cómo editar:** Puedes cambiar el valor de `"term"` (la palabra a seleccionar) y `"def"` (la explicación).
- **Cómo añadir páginas:** Sólo agrega un nuevo bloque `[ { term: "...", def: "..." }, { term: "...", def: "..." } ]` al final de la lista, antes de que cierre el arreglo principal.

---

## 4. Estructura de los Cajones (Filing Cabinet)
**Archivo a modificar:** `src/App.jsx`
**Líneas:** 16 a 20

Aquí está la variable `drawerData` que decide cuántos cajones hay en el archivero y qué documentos van en qué cajón.
- **Cómo editar:** Puedes agregar más documentos al arreglo `"docs"` de un cajón, pero asegúrate de que el nombre coincida EXACTAMENTE con el nombre de la llave que usaste en `src/data/documents.json`.

---

## 5. El Fax Inicial (Instrucciones)
**Archivo a modificar:** `src/App.jsx`
**Búscalo como:** `function FaxComponent()` (Alrededor de la línea 245)

El texto que el jugador lee al principio cuando el fax sube por la pantalla.
- **Cómo editar:** Baja hasta donde dice `<div className="fax-paper">` y verás varias etiquetas `<p>`. Puedes cambiar el texto libremente, borrar párrafos o añadir más `<p>Texto nuevo</p>`.

---

### Consejos Finales:
- **Cuidado con las comillas:** Al editar archivos de código (`.jsx`) o `.json`, asegúrate de no borrar accidentalmente las comillas (`"`) que envuelven los textos, ni las comas (`,`) que separan los elementos.
- **Formatos:** Todo el estilo visual, los colores, márgenes y tipografías están en `App.css`, `index.css` y los archivos `.css` individuales de cada componente.
