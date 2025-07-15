import React from 'react';

const ARViewer = () => (
  <iframe
    src="https://karysgoh.8thwall.app/facefiltersoc/"
    width="100%"
    height="100%"
    style={{ border: "none", minHeight: "100vh" }}
    allow="camera; microphone; fullscreen; xr-spatial-tracking;"
    title="8th Wall AR Face Filter for SoC Tour"
  />
);

export default ARViewer;
