import { useEffect, useState } from "react";

export function useResponsiveGridSize() {
  const [gridSize, setGridSize] = useState(280);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setGridSize(220);
        return;
      }
      if (width < 1024) {
        setGridSize(260);
        return;
      }
      setGridSize(280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return gridSize;
}
