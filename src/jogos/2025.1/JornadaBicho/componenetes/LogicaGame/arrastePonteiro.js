/*
 * Complementa o drag-and-drop nativo com Pointer Events. O HTML5 DnD continua
 * atendendo mouse; esta funcao atende dedo e caneta, que nao disparam `drop`
 * de forma confiavel nos navegadores moveis.
 */
export function iniciarArrastePorPonteiro(event, itemId, onDrop) {
  if (event.pointerType === 'mouse' || event.isPrimary === false) return;

  event.preventDefault();
  const elemento = event.currentTarget;
  const pointerId = event.pointerId;
  const inicioX = event.clientX;
  const inicioY = event.clientY;
  const rectInicial = elemento.getBoundingClientRect();
  const escalaX = rectInicial.width / elemento.offsetWidth || 1;
  const escalaY = rectInicial.height / elemento.offsetHeight || 1;

  elemento.classList.add('arrastando-toque');
  elemento.setPointerCapture?.(pointerId);

  function mover(pointerEvent) {
    if (pointerEvent.pointerId !== pointerId) return;
    pointerEvent.preventDefault();
    elemento.style.translate =
      `${(pointerEvent.clientX - inicioX) / escalaX}px ${(pointerEvent.clientY - inicioY) / escalaY}px`;
  }

  function limpar() {
    elemento.removeEventListener('pointermove', mover);
    elemento.removeEventListener('pointerup', soltar);
    elemento.removeEventListener('pointercancel', cancelar);
    elemento.classList.remove('arrastando-toque');
    elemento.style.translate = '';
    try {
      elemento.releasePointerCapture?.(pointerId);
    } catch {
      // O elemento pode ter sido removido pelo React depois de um acerto.
    }
  }

  function soltar(pointerEvent) {
    if (pointerEvent.pointerId !== pointerId) return;
    pointerEvent.preventDefault();

    elemento.style.pointerEvents = 'none';
    const alvo = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY);
    const zona = alvo?.closest('.drop-zone');
    elemento.style.pointerEvents = '';

    limpar();

    if (!zona) return;
    onDrop(String(itemId), zona.dataset.zoneName, {
      currentTarget: zona,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
  }

  function cancelar(pointerEvent) {
    if (pointerEvent.pointerId !== pointerId) return;
    limpar();
  }

  elemento.addEventListener('pointermove', mover, { passive: false });
  elemento.addEventListener('pointerup', soltar, { passive: false });
  elemento.addEventListener('pointercancel', cancelar);
}
