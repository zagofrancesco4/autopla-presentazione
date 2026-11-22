import{$ as e,A as t,B as n,C as r,Ct as i,D as a,E as o,F as s,G as c,H as l,I as u,J as d,K as f,L as p,M as m,N as ee,O as h,P as te,Q as ne,R as re,S as g,St as _,T as v,Tt as y,U as b,V as x,W as ie,X as ae,Y as oe,Z as se,_ as S,_t as ce,a as le,at as C,b as ue,bt as de,c as w,ct as fe,d as pe,dt as me,et as he,f as ge,ft as _e,g as ve,gt as ye,h as be,ht as xe,i as Se,it as Ce,j as T,k as we,l as Te,lt as E,m as D,mt as Ee,n as De,o as O,ot as Oe,p as ke,pt as Ae,q as je,r as Me,rt as Ne,s as Pe,st as Fe,t as k,tt as Ie,u as Le,ut as Re,v as ze,vt as Be,w as Ve,wt as He,x as A,xt as Ue,y as We,yt as Ge,z as Ke}from"./index-Gvc-a5jf.js";var qe=()=>new Promise(e=>window.requestIdleCallback?requestIdleCallback(e,{timeout:500}):setTimeout(e,50));async function Je(e,t,n,r=[],i=null){let a=performance.now(),o=[],s=i===!1?null:i||new He(4,4,{type:1016});for(let i of[{nome:`base`,applica(){},ripristina(){}},...r]){await qe();let r;i.applica();let a=e.getRenderTarget();try{e.setRenderTarget(s),r=i.g?e.compileAsync(i.g,i.camera||n,t):e.compileAsync(t,i.camera||n)}finally{e.setRenderTarget(a),i.ripristina()}await r,o.push(`${i.nome}: ${e.info.programs.length} programmi`)}return s&&!i&&s.dispose(),{ms:performance.now()-a,log:o}}var Ye=new d,j=new _,Xe=class extends Ne{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new e([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new e([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new Ce(t,6,1);return this.setAttribute(`instanceStart`,new C(n,3,0)),this.setAttribute(`instanceEnd`,new C(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new Ce(t,6,1);return this.setAttribute(`instanceColorStart`,new C(n,3,0)),this.setAttribute(`instanceColorEnd`,new C(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new y(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new d);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),Ye.setFromBufferAttribute(t),this.boundingBox.union(Ye))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Be),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)j.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(j)),j.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(j));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};f.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Ue},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},c.line={uniforms:de.merge([f.common,f.fog,f.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = perspective ? normalize( mix( start.xyz, end.xyz, 0.5 ) ) : vec3( 0.0, 0.0, - 1.0 );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;

				// only shift the depth of vertices in front of the camera (#35137)
				if ( clip.w > 0.0 ) clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				float len;

				if ( isOrthographic ) {

					// View rays are parallel to the z axis so the distance reduces to camera-space XY
					vec2 lineDir = worldEnd.xy - worldStart.xy;
					float t = clamp( dot( worldPos.xy - worldStart.xy, lineDir ) / dot( lineDir, lineDir ), 0.0, 1.0 );
					len = length( worldStart.xy + lineDir * t - worldPos.xy );

				} else {

					// Find the closest points on the view ray and the line segment
					vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
					vec3 lineDir = worldEnd - worldStart;
					vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

					vec3 p1 = worldStart + lineDir * params.x;
					vec3 p2 = rayEnd * params.y;
					vec3 delta = p1 - p2;
					len = length( delta );

				}

				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var Ze=class extends ce{constructor(e){super({type:`LineMaterial`,uniforms:de.clone(c.line.uniforms),vertexShader:c.line.vertexShader,fragmentShader:c.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},Qe=new i,$e=new _,et=new _,M=new i,N=new i,P=new i,F=new _,I=new fe,L=new Oe,tt=new _,R=new d,z=new Be,B=new i,V,H;function nt(e,t,n){return B.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),B.multiplyScalar(1/B.w),B.x=H/n.width,B.y=H/n.height,B.applyMatrix4(e.projectionMatrixInverse),B.multiplyScalar(1/B.w),Math.abs(Math.max(B.x,B.y))}function rt(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){L.start.fromBufferAttribute(i,r),L.end.fromBufferAttribute(a,r),L.applyMatrix4(n);let o=new _,s=new _;V.distanceSqToSegment(L.start,L.end,s,o),s.distanceTo(o)<H*.5&&t.push({point:s,pointOnLine:o,distance:V.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function it(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;V.at(1,P),P.w=1,P.applyMatrix4(t.matrixWorldInverse),P.applyMatrix4(r),P.multiplyScalar(1/P.w),P.x*=i.x/2,P.y*=i.y/2,P.z=0,F.copy(P),I.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(M.fromBufferAttribute(s,t),N.fromBufferAttribute(c,t),M.w=1,N.w=1,M.applyMatrix4(I),N.applyMatrix4(I),M.z>u&&N.z>u)continue;if(M.z>u){let e=M.z-N.z,t=(M.z-u)/e;M.lerp(N,t)}else if(N.z>u){let e=N.z-M.z,t=(N.z-u)/e;N.lerp(M,t)}M.applyMatrix4(r),N.applyMatrix4(r),M.multiplyScalar(1/M.w),N.multiplyScalar(1/N.w),M.x*=i.x/2,M.y*=i.y/2,N.x*=i.x/2,N.y*=i.y/2,L.start.copy(M),L.start.z=0,L.end.copy(N),L.end.z=0;let o=L.closestPointToPointParameter(F,!0);L.at(o,tt);let l=Fe.lerp(M.z,N.z,o),d=l>=-1&&l<=1,f=F.distanceTo(tt)<H*.5;if(d&&f){L.start.fromBufferAttribute(s,t),L.end.fromBufferAttribute(c,t),L.start.applyMatrix4(a),L.end.applyMatrix4(a);let r=new _,i=new _;V.distanceSqToSegment(L.start,L.end,i,r),n.push({point:i,pointOnLine:r,distance:V.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var at=class extends E{constructor(e=new Xe,t=new Ze({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)$e.fromBufferAttribute(t,e),et.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+$e.distanceTo(et);let i=new Ce(r,2,1);return e.setAttribute(`instanceDistanceStart`,new C(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new C(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;if(r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`),n===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;V=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;H=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),z.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?H*.5:nt(r,Math.max(r.near,z.distanceToPoint(V.origin)),s.resolution),z.radius+=c,V.intersectsSphere(z)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),R.copy(o.boundingBox).applyMatrix4(a);let l;l=n?H*.5:nt(r,Math.max(r.near,R.distanceToPoint(V.origin)),s.resolution),R.expandByScalar(l),V.intersectsBox(R)!==!1&&(n?rt(this,t):it(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(Qe),this.material.uniforms.resolution.value.set(Qe.z,Qe.w))}},ot=new Ze({color:16103746,linewidth:1.6,depthTest:!1,transparent:!0,worldUnits:!1}),U=T();function W(e,t,n,r){return U.copy(e).applyMatrix4(t.matrixWorld).project(G.cam),{x:(U.x+1)/2*n,y:(1-U.y)/2*r,ok:U.z<1&&U.z>-1}}function st(){let e=x(`mechTags`),t=x(`mechLines`),n=Me&&w.etichette&&!(w.ecc>0||w.eccT>0);if(e.style.display=t.style.display=n?``:`none`,!n)return;let r=x(`mechView`),i=r.getBoundingClientRect(),a=i.width,o=i.height,s=a<700,c=[];for(let e of[`mechPanel`,`mechInfo`,`mechLegend`,`mechChecks`,`mechScale`]){let t=x(e);if(t&&!t.hidden&&t.offsetParent&&t.style.visibility!==`hidden`){let e=t.getBoundingClientRect();c.push({x0:e.left-i.left-4,y0:e.top-i.top-4,x1:e.right-i.left+4,y1:e.bottom-i.top+4})}}if(O&&O.visible){O.updateMatrixWorld(!0);let e=[T(-55,-2,0),T(55,-2,0),T(-55,18,0),T(55,18,0)].map(e=>W(e,O,a,o));c.push({x0:Math.min(...e.map(e=>e.x))-4,y0:Math.min(...e.map(e=>e.y))-4,x1:Math.max(...e.map(e=>e.x))+4,y1:Math.max(...e.map(e=>e.y))+4})}r.querySelectorAll(`.mlbl`).forEach(e=>{let t=e.getBoundingClientRect();t.width&&c.push({x0:t.left-i.left-4,y0:t.top-i.top-4,x1:t.right-i.left+4,y1:t.bottom-i.top+4})});let l=[];for(let e of Me.items){let t=e.a.clone().applyMatrix4(e.parent.matrixWorld),n=W(e.a,e.parent,a,o),r=W(e.l,e.parent,a,o);e.show=n.ok&&r.ok&&(!s||e.prim)&&!(w.sez&&t.x<w.xCut-.5)&&n.x>-20&&n.x<a+20&&n.y>-20&&n.y<o+20,e.el.style.display=e.show?``:`none`,e.show&&(e.w||(e.w=e.el.offsetWidth,e.h=e.el.offsetHeight),e.ax=n.x,e.ay=n.y,e.x=r.x-e.w/2,e.y=r.y-e.h/2,l.push(e))}for(let e=0;e<40;e++){let e=!1;for(let t=0;t<l.length;t++){let n=l[t];for(let r=t+1;r<l.length;r++){let t=l[r],i=Math.min(n.x+n.w,t.x+t.w)-Math.max(n.x,t.x)+4,a=Math.min(n.y+n.h,t.y+t.h)-Math.max(n.y,t.y)+4;if(i>0&&a>0){if(e=!0,a<i){let e=(n.y<t.y?-1:1)*a/2;n.y+=e,t.y-=e}else{let e=(n.x<t.x?-1:1)*i/2;n.x+=e,t.x-=e}}}for(let t of c){let r=Math.min(n.x+n.w,t.x1)-Math.max(n.x,t.x0),i=Math.min(n.y+n.h,t.y1)-Math.max(n.y,t.y0);r>0&&i>0&&(e=!0,i<r?n.y+=n.y+n.h/2<(t.y0+t.y1)/2?-i:i:n.x+=n.x+n.w/2<(t.x0+t.x1)/2?-r:r)}n.x=Math.max(4,Math.min(a-n.w-4,n.x)),n.y=Math.max(4,Math.min(o-n.h-4,n.y))}if(!e)break}let u=[],d=(e,t)=>Math.min(e.x1,t.x1)-Math.max(e.x0,t.x0)>0&&Math.min(e.y1,t.y1)-Math.max(e.y0,t.y0)>0;for(let e of[...l].sort((e,t)=>t.prim-e.prim)){let t={x0:e.x-1,y0:e.y-1,x1:e.x+e.w+1,y1:e.y+e.h+1};u.some(e=>d(e,t))||c.some(e=>d(e,t))?e.el.style.display=`none`:(u.push(t),e.ok=!0)}l.splice(0,l.length,...l.filter(e=>e.ok)),l.forEach(e=>{e.ok=!1});let f=``;for(let e of l){e.el.style.transform=`translate(${e.x.toFixed(1)}px,${e.y.toFixed(1)}px)`;let t=Math.max(e.x,Math.min(e.ax,e.x+e.w)),n=Math.max(e.y,Math.min(e.ay,e.y+e.h));f+=`M${e.ax.toFixed(1)} ${e.ay.toFixed(1)}L${t.toFixed(1)} ${n.toFixed(1)}`}t.setAttribute(`viewBox`,`0 0 ${a} ${o}`),t.innerHTML=`<path d="${f}" stroke="#d8d8dc" stroke-opacity=".55" stroke-width="1" fill="none"/>`+l.map(e=>`<circle cx="${e.ax.toFixed(1)}" cy="${e.ay.toFixed(1)}" r="3" fill="#0b0b0c" stroke="#fff" stroke-width="1.5"/>`).join(``)}function ct(){let e=x(`mechScale`);if(!w.sez){e.hidden=!0;return}let t=x(`mechView`).getBoundingClientRect(),n=T(w.xCut,(k.yTopOut+k.yBotOut)/2,k.zLeftOut),r=n.clone().project(G.cam),i=n.clone().add(T(0,0,10)).project(G.cam),a=n.clone().add(T(0,10,0)).project(G.cam),o=Math.max(Math.hypot((i.x-r.x)*t.width/2,(i.y-r.y)*t.height/2),Math.hypot((a.x-r.x)*t.width/2,(a.y-r.y)*t.height/2))/10,s=[5,10,20,50,100,200].find(e=>e*o>=70)||200,c=x(`mechPanel`);e.style.bottom=(c.hidden?10:c.offsetHeight+20)+`px`,e.hidden=!1,x(`mechScaleBar`).style.width=(s*o).toFixed(1)+`px`,x(`mechScaleT`).textContent=`${s} mm`}var G=null,K=!1,q=null;function lt(){let e=x(`mechView`),t=new je({antialias:!0,powerPreference:`high-performance`});t.setPixelRatio(Math.min(window.devicePixelRatio||1,te.p.prMax)),t.toneMapping=7,t.toneMappingExposure=1,t.shadowMap.autoUpdate=!1,t.shadowMap.enabled=!0,t.shadowMap.type=1,e.appendChild(t.domElement);let n=new p;n.domElement.id=`mechLabels`,e.appendChild(n.domElement);let i=new ye;i.background=new ae(1118740),i.fog=new he(1118740,2600,9e3);let a=new ie(t);i.environment=a.fromScene(new m,.04).texture,i.environmentIntensity=.55;let o=new ne(16774892,2.6);o.castShadow=!0;let c=2048;o.shadow.mapSize.set(c,c),o.shadow.bias=-3e-4,o.shadow.normalBias=.3,o.shadow.radius=4,Object.assign(o.shadow.camera,{left:-300,right:300,top:300,bottom:-300,near:10,far:3e3}),i.add(o),i.add(o.target);let u=new ne(15265527,.55);i.add(u),i.add(u.target);let d=new ne(16777215,1.1);i.add(d),i.add(d.target);let f=new E(new oe(14e3,128),new me({color:1316119,roughness:.62,metalness:0,envMapIntensity:.35}));f.rotation.x=-Math.PI/2,f.receiveShadow=!0,f.name=`studioPavimento`,f.raycast=()=>{};let h=new E(new Ee(8e3,8e3),new ce({name:`StudioGriglia`,transparent:!0,depthWrite:!1,uniforms:{centro:{value:new _}},vertexShader:`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 centro; varying vec3 vW;
      float linea(vec2 p, float passo){ vec2 q = p / passo; vec2 g = abs(fract(q - .5) - .5) / fwidth(q); return 1. - min(min(g.x, g.y), 1.); }
      void main(){ vec2 p = vW.xz; float d = length(p - centro.xz);
        float a = (linea(p, 10.) * .25 + linea(p, 100.) * .75) * (1. - smoothstep(150., 900., d));
        gl_FragColor = vec4(vec3(.26), a * .45);
        #include <colorspace_fragment>
      }`}));h.rotation.x=-Math.PI/2,h.position.y=.5,h.renderOrder=1,h.raycast=()=>{};let y=new Ie;y.add(f,h),y.position.y=-335,i.add(y);let b=new _e(30,1,1,2e4),S=new re(b,t.domElement);S.enableDamping=!0,S.dampingFactor=.1,G={renderer:t,lr:n,scene:i,cam:b,ctl:S,sun:o,fill:u,rim:d,pipe:new s(t,i,b),studio:y,griglia:h,clock:new l,tween:null},Te.V=G,Te.dopoBuild=()=>{G.sporco=!0,G.scene.add(g),v(w.trasp),r(w.etichette),yt(),Q(G.vista||`iso`)},i.add(g),G.ambientePronto=new Ge().loadAsync(`./asset/cielo/studio-1k.webp`).then(e=>{e.colorSpace=xe,e.mapping=303;let t=new ye;t.background=e,t.backgroundIntensity=ee.studio.Lmax*.055;let n=new E(new se(5,5,3.2,48,1,!0),new Re({color:new ae(.85,.86,.88),side:1}));n.position.y=-.4,t.add(n),i.environment=a.fromScene(t,0,.1,100).texture,i.environmentIntensity=1,n.geometry.dispose(),n.material.dispose(),e.dispose(),G.sporco=!0}).catch(()=>{}),new ResizeObserver(ut).observe(e)}function ut(){if(!G)return;let e=x(`mechView`),t=Math.max(1,e.clientWidth),n=Math.max(1,e.clientHeight);G.renderer.setSize(t,n),G.lr.setSize(t,n),G.cam.aspect=t/n,G.cam.updateProjectionMatrix(),ot.resolution.set(t,n),G.sporco=!0}function J(e,t,n,r){let i=n.clone().normalize(),a=T().subVectors(t,e).normalize(),o=e.clone().add(n),s=t.clone().add(n),c=a.clone().add(i).normalize().multiplyScalar(2.2),l=[e.clone().addScaledVector(i,1.5),o.clone().addScaledVector(i,2.5),t.clone().addScaledVector(i,1.5),s.clone().addScaledVector(i,2.5),o,s,o.clone().sub(c),o.clone().add(c),s.clone().sub(c),s.clone().add(c)],d=new Xe;d.setPositions(l.flatMap(e=>[e.x,e.y,e.z]));let f=new at(d,ot);f.renderOrder=999,q.add(f);let p=document.createElement(`div`);p.className=`mlbl mq`,p.textContent=r??`${ze(e.distanceTo(t),1)} mm`;let m=new u(p);m.position.copy(o).add(s).multiplyScalar(.5).addScaledVector(i,3),q.add(m)}function Y(e,t){q&&(S(q),q.removeFromParent(),ve(q)),q=new Ie;let r=k.h,i=n.tubo.spessore;if(e){G.scene.add(q);let e=t+.1,n=k.cTop+(k.Ro-k.half)/Pe;J(T(e,k.yBotOut,k.zLeftOut),T(e,k.yBotOut,k.zRight),T(0,-16,0)),J(T(e,k.yBotOut,k.zLeftOut),T(e,k.yTopOut,k.zLeftOut),T(0,0,-16)),J(T(e,-r+i,-r),T(e,-r+i,r),T(0,8,0)),J(T(e,n,k.zRuotaMax),T(e,n,k.zRailNear),T(0,34,0),`${ze(k.zRailNear-k.zRuotaMax,1)} mm`)}else be.add(q),J(T(-k.xHalf,k.yBotOut,k.zLeftOut),T(k.xHalf,k.yBotOut,k.zLeftOut),G.vista===`alto`?T(0,0,-16):T(0,-16,0)),G.vista!==`alto`&&J(T(-k.xHalf,k.yBotOut,k.zLeftOut),T(-k.xHalf,k.yTopOut,k.zLeftOut),G.vista===`lato`?T(0,0,-16):T(-16,0,0))}function X(e,t,n,r){let i=e.clone().addScaledVector(t.clone().normalize(),n);G.cam.near=n/50,G.cam.far=n*20,G.cam.updateProjectionMatrix(),r?(G.cam.position.copy(i),G.ctl.target.copy(e),G.ctl.update(),G.tween=null):G.tween={t:0,fp:G.cam.position.clone(),ft:G.ctl.target.clone(),tp:i,tt:e.clone()},G.sun.position.copy(e).add(T(-500,900,-650)),G.sun.target.position.copy(e),G.fill.position.copy(e).add(T(700,300,500)),G.fill.target.position.copy(e),G.rim.position.copy(e).add(T(600,500,900)),G.rim.target.position.copy(e),G.griglia&&G.griglia.material.uniforms.centro.value.copy(e)}var dt=new Ae(T(1,0,0),1e9);function Z(e){G.renderer.clippingPlanes=[dt],dt.constant=e==null?1e9:-e,G.studio&&(G.studio.visible=e==null)}function Q(e=`iso`,t){if(!G)return;let r=w.X,i=(k.yTopOut+k.yBotOut)/2,a=k.zMontante+n.ringhiera.montante,o=(k.zLeftOut+a)/2,s=Math.max(k.yTopOut-k.yBotOut,a-k.zLeftOut,2*k.xHalf)+70,c={iso:[T(-1.1,.8,-1.3),r],fronte:[T(0,0,-1),r],alto:[T(0,1,-1e-4),r],lato:[T(-1,0,0),r],sezione:[T(-1,0,0),r+k.xSt[1]],sezioneMotore:[T(-1,0,0),r]}[e];if(!c)return;G.vista=e;let[l,u]=c,d=e.startsWith(`sezione`);d?(w.sez=!0,w.xCut=u):w.sez||Z(null),w.sez&&(Z(w.xCut),ft());let f=Math.min(1,G.cam.aspect),p=s/2/Math.tan(G.cam.fov/2*De)/f*(e===`iso`?1.5:1.05);X(T(d?u:r,i,o),l,p,t),Y(w.sez,w.xCut),document.querySelectorAll(`#mechBar [data-v]`).forEach(t=>t.classList.toggle(`on`,t.dataset.v===e))}function ft(){let e=x(`mechCut`);e&&(e.min=w.X-k.xHalf-20,e.max=w.X+k.xHalf+20,e.value=w.xCut,x(`mechCutT`).textContent=`X ${ze(w.xCut-w.X,1)} mm dal centro`)}function pt(){w.sez=!w.sez,D(`sezione`,w.sez),w.sez?(w.xCut=w.X+k.xSt[1],A(`<label class="mrow">Taglio <input id="mechCut" type="range" step="0.5"><span id="mechCutT"></span></label>`+(w.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:``)),x(`mechCut`).addEventListener(`input`,e=>{w.xCut=+e.target.value,Z(w.xCut),ft(),Y(!0,w.xCut)}),Q(`sezione`)):(Z(null),A(w.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:null),Q(`iso`))}function mt(){w.anim&&we(),w.espT&&(w.espT=0,D(`esploso`,!1)),w.eccT=w.eccT>0?0:1,D(`eccentrico`,w.eccT>0);let e=w.X+k.xSt[1];w.sez=!0,w.xCut=e-3,Z(w.xCut),D(`sezione`,!0),A(null),X(T(e,k.yShank-4,(n.ruote.inferiore.z+k.zBlk0)/2),T(-1,.25,-.45),105),Y(!0,w.xCut)}function ht(){w.anim&&we(),w.espT=w.esp=0,ge(0),D(`esploso`,!1),a(!0),w.sez=!1,Z(null),D(`sezione`,!1),A(null),o(n.vista.carrello),w.X0=w.X,w.v=n.animazione.velocita,v(!0),r(!0),h(),Q(`iso`)}function gt(){if(!K)return;let e=Math.min(G.clock.getDelta(),.05),t=!1;if(w.anim){let r=n,i=r.vista.inizio+k.xHalf+10,a=r.vista.inizio+r.vista.lunghezza-k.xHalf-10,s=w.X+w.dir*w.v*e;s>a&&(s=a,w.dir=-1),s<i&&(s=i,w.dir=1),o(s),Le(),t=!0}if(w.esp!==w.espT&&(w.esp+=Math.sign(w.espT-w.esp)*Math.min(Math.abs(w.espT-w.esp),e/1.2),ge(b(w.esp)),t=!0),w.ecc!==w.eccT&&(w.ecc+=Math.sign(w.eccT-w.ecc)*Math.min(Math.abs(w.eccT-w.ecc),e/3),pe(w.ecc),w.ecc===0&&We(null),t=!0),t&&h(),G.tween){let t=G.tween;t.t=Math.min(1,t.t+e/.8);let n=b(t.t);G.cam.position.lerpVectors(t.fp,t.tp,n),G.ctl.target.lerpVectors(t.ft,t.tt,n),t.t>=1&&(G.tween=null)}let r=G.ctl.update();O&&(O.visible=!w.sez,O.quaternion.copy(be.quaternion).invert().multiply(G.cam.quaternion),O.children.forEach(e=>{e.isCSS2DObject&&(e.visible=!w.sez)}));let i=[w.X,w.esp,w.ecc,w.sez?w.xCut:`-`,w.trasp,w.etichette,ue,ke,G.vista].join(`|`);requestAnimationFrame(gt);let a=i!==G.firma;(G.sporco||r||a||t||G.tween)&&((G.sporco||a||t)&&(G.renderer.shadowMap.needsUpdate=!0),G.sporco=!1,G.firma=i,G.pipe.render(),G.lr.render(G.scene,G.cam),st(),ct())}function _t(){let e={trasmissione:`Trasmissione`,guide:`Guide`,elettronica:`Elettronica`,acqua:`Acqua`};x(`mechLegend`).innerHTML=Object.entries(n.aspetto.funzioni).map(([t,n])=>`<span><i style="background:${n}"></i>${e[t]||t}</span>`).join(``)+`<span><i style="background:#c9cdd2"></i>Struttura</span>`}function vt(){return G||(lt(),Z(null),yt()),G}function yt(){g.traverse(e=>{e.isMesh&&!e.material.transparent&&(e.geometry.boundingSphere||e.geometry.computeBoundingSphere(),e.geometry.boundingSphere.radius<6&&(e.castShadow=!1))})}function $(e){let t=Se(`petg`);t.transparent=e,t.opacity=e?le.petg.opacity:1,t.depthWrite=!e,t.needsUpdate=!0,g.traverse(n=>{n.isMesh&&n.material===t&&(n.castShadow=!e,n.receiveShadow=!e)})}async function bt(){vt(),Se(`petg`),await G.ambientePronto;let e=await Je(G.renderer,G.scene,G.cam,[{nome:`box opaca`,applica(){$(!1)},ripristina(){$(!0)}},{nome:`quote`,applica(){let e=new Xe;e.setPositions([0,0,0,1,1,1]),this.l=new at(e,ot),G.scene.add(this.l)},ripristina(){this.l.removeFromParent()}}]);return X(T(w.X,0,0),T(-1.1,.8,-1.3),600,!0),G.renderer.shadowMap.needsUpdate=!0,$(!1),G.pipe.render(),G.renderer.shadowMap.needsUpdate=!0,$(!0),G.pipe.render(),e.log.push(`ombre: `+G.renderer.info.programs.length+` programmi`),e}var xt=!1;function St(){x(`mech`).hidden=!1,xt||(xt=!0,x(`mechChecks`).hidden=!0,x(`mechCk`).hidden=!Ke,x(`mechSub`).textContent=Ke?`Gemello digitale · misure in mm da CONFIG`:`Gemello digitale del meccanismo`,_t(),vt(),v(!0),r(!0)),ut(),Q(`iso`,!0),G.sporco=!0,K||(K=!0,G.clock.getDelta(),requestAnimationFrame(gt))}function Ct(){x(`mech`).hidden=!0,K=!1,location.hash===`#meccanismo`&&history.replaceState(null,``,location.pathname+location.search)}x(`mechClose`).addEventListener(`click`,Ct),x(`mechCk`).addEventListener(`click`,()=>{let e=x(`mechChecks`);e.hidden=!e.hidden}),x(`mechColor`).addEventListener(`click`,()=>{Ve(!ue),G&&(G.sporco=!0)}),x(`mechBar`).addEventListener(`click`,e=>{let n=e.target.closest(`button`);n&&(G&&(G.sporco=!0),n.dataset.v?(w.sez&&!n.dataset.v.startsWith(`sezione`)&&(w.sez=!1,Z(null),D(`sezione`,!1),A(w.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:null)),Q(n.dataset.v)):{animazione:we,esploso:t,sezione:pt,eccentrico:mt,etichette:()=>r(!w.etichette),trasparenza:()=>v(!w.trasp),reset:ht}[n.dataset.a]?.())});function wt(){if(!G)return null;let e=G.renderer,t=e.info;t.autoReset=!1,t.reset(),e.render(G.scene,G.cam);let n={calls:t.render.calls,tri:t.render.triangles};return t.autoReset=!0,n}export{Y as buildDims,X as camTo,Ct as close,J as dim,lt as initView,ct as layoutScale,st as layoutTags,_t as legend,gt as loop,wt as misure,St as open,bt as precompilaGemello,vt as prepara,ht as reset,ut as resizeView,W as scr,Z as setClip,ft as syncSezioneUI,mt as toggleEcc,pt as toggleSezione,Q as view};