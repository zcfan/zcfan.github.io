import { PerspectiveCamera, Renderer } from "three";

/**
 * setup renderer and camera react on window resize event
 */
export function setupOnResize(
  container: HTMLElement,
  renderer: Renderer,
  camera: PerspectiveCamera
) {
  function onResize() {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
  };
}

/**
 * setup pointer & touch event listener, for simplify control implementation.
 */
export function setupWindowPointerOrTouchMove(
  onMove: (x: number, y: number) => void
): () => void {
  function handleMove(event: PointerEvent | TouchEvent) {
    const { clientX, clientY } = isTouchEvent(event) ? event.touches?.[0]! : event;
    onMove(clientX / window.innerWidth, clientY / window.innerHeight);
  }

  function handleOut() {
    onMove(-1, -1);
  }

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerout", handleOut);
  window.addEventListener("touchmove", handleMove);
  window.addEventListener("touchstart", handleMove);
  window.addEventListener("touchend", handleOut);

  return () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerout", handleOut);
    window.removeEventListener("touchmove", handleMove);
    window.removeEventListener("touchstart", handleMove);
    window.removeEventListener("touchend", handleOut);
  };
}

function isTouchEvent(event: PointerEvent | TouchEvent): event is TouchEvent {
  return (event as TouchEvent).touches !== undefined
}