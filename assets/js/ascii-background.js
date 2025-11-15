// ASCII BACKGROUND DDD – COMPATÍVEL COM HTML VANILLA
const AsciiBackground = (() => {
  const cols = 120;
  const rows = 42;
  const density = [" ", ".", ":", "·", "•", "-", "=", "+", "*", "#", "%", "█"];

  function pick(v) {
    const i = Math.floor(((v + 1) / 2) * (density.length - 1));
    return density[i] !== undefined ? density[i] : " ";
  }

  function init() {
    const pre = document.createElement("pre");
    pre.id = "ascii-bg";
    document.body.prepend(pre);

    pre.style.position = "fixed";
    pre.style.inset = "0";
    pre.style.margin = "0";
    pre.style.padding = "0";
    pre.style.fontFamily = "monospace";
    pre.style.fontSize = "9px";
    pre.style.lineHeight = "1.1em";
    pre.style.opacity = "0.08";
    pre.style.mixBlendMode = "lighten";
    pre.style.whiteSpace = "pre";
    pre.style.pointerEvents = "none";
    pre.style.zIndex = "0";

    function render(t) {
      const tt = t * 0.0007;
      let out = "";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v =
            Math.sin(x * 0.12 + tt) * 0.6 +
            Math.cos(y * 0.18 + tt * 1.4) * 0.4 +
            Math.sin((x - y) * 0.06 + tt * 2) * 0.3;

          out += pick(v);
        }
        out += "\n";
      }

      pre.textContent = out;
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", AsciiBackground.init);

