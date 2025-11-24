const initHeroShader = () => {
  const canvas = document.getElementById('hero-ascii-canvas');
  if (!canvas) return;

  // Try to get WebGL context with alpha support enabled
  const gl = canvas.getContext('webgl', { alpha: true }) || canvas.getContext('experimental-webgl', { alpha: true });
  if (!gl) return;

  // Enable blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Use dpr = 1 for performance optimization
  const dpr = 1; 

  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const vertexSrc = `
    attribute vec2 position;
    varying vec2 v_uv;
    uniform float uScreenRatio;
    uniform float uVideoRatio;

    void main() {
      vec2 uv = (position + 1.0) * 0.5;
      
      vec2 scale = vec2(1.0);
      
      if (uScreenRatio > uVideoRatio) {
          scale.x = uScreenRatio / uVideoRatio;
      } else {
          scale.y = uVideoRatio / uScreenRatio;
      }
      
      float zoom = 1.5;
      scale *= zoom;
      
      uv = (uv - 0.5) * scale + 0.5;
      
      v_uv = vec2(uv.x, 1.0 - uv.y); 
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSrc = `
    precision mediump float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_charSize;
    uniform sampler2D u_image;
    uniform bool u_imageLoaded;

    float character(float n, vec2 p) {
      p = floor(p * vec2(-4.0, 4.0) + 2.5);
      if (p.x < 0.0 || p.x > 4.0 || p.y < 0.0 || p.y > 4.0) return 0.0;
      float index = p.x + 5.0 * p.y;
      return mod(floor(n / pow(2.0, index)), 2.0);
    }

    void main() {
      vec2 glyphUV = fract(gl_FragCoord.xy / u_charSize) * 2.0 - 1.0;
      vec2 texUV = v_uv; 
      
      float gray = 0.0;
      if (u_imageLoaded) {
        if (texUV.x >= 0.0 && texUV.x <= 1.0 && texUV.y >= 0.0 && texUV.y <= 1.0) {
            vec4 texColor = texture2D(u_image, texUV);
            
            if (texColor.a < 0.1) {
                gray = 0.0;
            } else {
                vec3 imgCol = texColor.rgb;
                gray = 0.3 * imgCol.r + 0.59 * imgCol.g + 0.11 * imgCol.b;
                gray = gray * 1.2; 
            }
        }
      }

      float n = 4096.0; 
      if (gray > 0.1) n = 65600.0;   
      if (gray > 0.2) n = 163153.0;  
      if (gray > 0.3) n = 15255086.0; 
      if (gray > 0.4) n = 13121101.0; 
      if (gray > 0.5) n = 15252014.0; 
      if (gray > 0.6) n = 13195790.0; 
      if (gray > 0.7) n = 11512810.0; 

      float glyph = character(n, glyphUV);
      vec3 col = vec3(gray) * glyph;
      
      float alpha = 1.0;
      if (length(col) < 0.01) {
          alpha = 0.0;
      }
      
      gl_FragColor = vec4(col, alpha);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSrc);

  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uCharSize = gl.getUniformLocation(program, 'u_charSize');
  const uImage = gl.getUniformLocation(program, 'u_image');
  const uImageLoaded = gl.getUniformLocation(program, 'u_imageLoaded');
  const uScreenRatio = gl.getUniformLocation(program, 'uScreenRatio');
  const uVideoRatio = gl.getUniformLocation(program, 'uVideoRatio');

  const isMobile = window.innerWidth <= 768;
  const charWidth = isMobile ? 5.4 : 5.4;
  const charHeight = isMobile ? 9.0 : 9.0;

  const video = document.createElement('video');
  video.src = '/assets/asciivideo/resources/DDD_3D-LOGO_ROTATE_V3.mov';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  // Important for iOS
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  
  let videoReady = false;
  
  video.addEventListener('canplay', () => {
    videoReady = true;
    video.play().catch(e => console.log("Video play error:", e));
  });
  
  // Android autoplay fallback
  const onInteraction = () => {
    if (video.paused) {
        video.play().catch(() => {});
    }
    document.removeEventListener('click', onInteraction);
    document.removeEventListener('touchstart', onInteraction);
  };
  document.addEventListener('click', onInteraction);
  document.addEventListener('touchstart', onInteraction);

  video.load();

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  // New optimized render loop using requestVideoFrameCallback
  const updateTexture = () => {
    if (videoReady && video.readyState >= 3) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(updateTexture);
    } else {
      // Fallback handled in main render loop
    }
  };

  if ('requestVideoFrameCallback' in video) {
    video.requestVideoFrameCallback(updateTexture);
  }

  const render = () => {
    // Clear with transparent color
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    const screenRatio = canvas.width / canvas.height;
    const videoRatio = (video.videoWidth && video.videoHeight) ? (video.videoWidth / video.videoHeight) : 1.0;

    gl.uniform1f(uScreenRatio, screenRatio);
    gl.uniform1f(uVideoRatio, videoRatio);
    
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform2f(uCharSize, charWidth, charHeight);
    gl.uniform1i(uImageLoaded, videoReady ? 1 : 0);

    // Fallback for browsers without requestVideoFrameCallback
    if (!('requestVideoFrameCallback' in video) && videoReady && video.readyState >= 3) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }
    
    gl.uniform1i(uImage, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroShader);
} else {
  initHeroShader();
}
