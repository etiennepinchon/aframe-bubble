AFRAME.registerComponent('bubble', {
  schema: {
    enabled: {default: true}
  },
  init: function () {
    var scene = this.el.sceneEl.object3D;

    // Create refraction camera
    this.refractCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
  	scene.add( this.refractCamera );

    // Setup shader
    var fShader = THREE.FresnelShader;
  	var fresnelUniforms = {
  		"mRefractionRatio": { type: "f", value: 1.02 },
  		"mFresnelBias": { type: "f", value: 0.1 },
  		"mFresnelPower": { type: "f", value: 2.0 },
  		"mFresnelScale": { type: "f", value: 1.0 },
  		"tCube": { type: "t", value: this.refractCamera.renderTarget.texture } //  textureCube }
  	};

    // Create custom material for the shader
  	this.refractMaterial = new THREE.ShaderMaterial({
  	  uniforms: fresnelUniforms,
  		vertexShader: fShader.vertexShader,
  		fragmentShader: fShader.fragmentShader
  	});

    this.originalMaterial = this.el.object3DMap.mesh.material;
  },
  update: function () {
    if (this.data.enabled) {
      this.el.object3DMap.mesh.material = this.refractMaterial;
    	this.refractCamera.position = this.position;
    } else {
      this.el.object3DMap.mesh.material = this.originalMaterial;
    }
  },
  tick: function () {
    if (!this.refractCamera) { return; }
    this.refractCamera.updateCubeMap( this.el.sceneEl.renderer, this.el.sceneEl.object3D );
  },
  remove: function () {
    if (!this.refractCamera) { return; }
    var scene = this.el.sceneEl.object3D;
    scene.remove( this.refractCamera );
    this.refractCamera = null;
    this.el.object3DMap.mesh.material = this.originalMaterial;
  },
  pause: function () {},
  play: function () {}
});


/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Based on Nvidia Cg tutorial
 */

if (!THREE.FresnelShader) {
  THREE.FresnelShader = {

  	uniforms: {
  		"mRefractionRatio": { type: "f", value: 1.02 },
  		"mFresnelBias": { type: "f", value: 0.1 },
  		"mFresnelPower": { type: "f", value: 2.0 },
  		"mFresnelScale": { type: "f", value: 1.0 },
  		"tCube": { type: "t", value: null }
  	},

  	vertexShader: [

  		"uniform float mRefractionRatio;",
  		"uniform float mFresnelBias;",
  		"uniform float mFresnelScale;",
  		"uniform float mFresnelPower;",

  		"varying vec3 vReflect;",
  		"varying vec3 vRefract[3];",
  		"varying float vReflectionFactor;",

  		"void main() {",

  			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
  			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

  			"vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

  			"vec3 I = worldPosition.xyz - cameraPosition;",

  			"vReflect = reflect( I, worldNormal );",
  			"vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio );",
  			"vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.99 );",
  			"vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.98 );",
  			"vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );",

  			"gl_Position = projectionMatrix * mvPosition;",

  		"}"

  	].join("\n"),

  	fragmentShader: [

  		"uniform samplerCube tCube;",

  		"varying vec3 vReflect;",
  		"varying vec3 vRefract[3];",
  		"varying float vReflectionFactor;",

  		"void main() {",

  			"vec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );",
  			"vec4 refractedColor = vec4( 1.0 );",

  			"refractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;",
  			"refractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;",
  			"refractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;",

  			"gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );",

  		"}"

  	].join("\n")

  };
}
