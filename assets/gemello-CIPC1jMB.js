import{$ as e,A as t,B as n,C as r,Ct as i,D as a,E as o,F as s,G as c,H as l,I as u,J as d,K as f,L as p,M as ee,N as te,O as m,P as ne,Q as re,R as ie,S as h,St as g,T as _,Tt as v,U as y,V as b,W as ae,X as oe,Y as se,Z as ce,_ as x,_t as le,a as ue,at as S,b as de,bt as fe,c as C,ct as pe,d as me,dt as he,et as ge,f as _e,ft as ve,g as ye,gt as be,h as xe,ht as Se,i as Ce,it as we,j as w,k as Te,l as Ee,lt as T,m as E,mt as De,n as Oe,o as D,ot as ke,p as Ae,pt as je,q as Me,r as Ne,rt as Pe,s as Fe,st as Ie,t as O,tt as Le,u as Re,ut as ze,v as Be,vt as Ve,w as He,wt as Ue,x as k,xt as We,y as Ge,yt as Ke,z as qe}from"./index-BTcbdYwP.js";var Je=()=>new Promise(e=>window.requestIdleCallback?requestIdleCallback(e,{timeout:500}):setTimeout(e,50));async function Ye(e,t,n,r=[],i=null){let a=performance.now(),o=[],s=i===!1?null:i||new Ue(4,4,{type:1016});for(let i of[{nome:`base`,applica(){},ripristina(){}},...r]){await Je();let r;i.applica();let a=e.getRenderTarget();try{e.setRenderTarget(s),r=i.g?e.compileAsync(i.g,i.camera||n,t):e.compileAsync(t,i.camera||n)}finally{e.setRenderTarget(a),i.ripristina()}await r,o.push(`${i.nome}: ${e.info.programs.length} programmi`)}return s&&!i&&s.dispose(),{ms:performance.now()-a,log:o}}var Xe=new d,A=new g,Ze=class extends Pe{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new e([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new e([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new we(t,6,1);return this.setAttribute(`instanceStart`,new S(n,3,0)),this.setAttribute(`instanceEnd`,new S(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new we(t,6,1);return this.setAttribute(`instanceColorStart`,new S(n,3,0)),this.setAttribute(`instanceColorEnd`,new S(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new v(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new d);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),Xe.setFromBufferAttribute(t),this.boundingBox.union(Xe))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ve),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)A.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(A)),A.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(A));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};f.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new We},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},c.line={uniforms:fe.merge([f.common,f.fog,f.line]),vertexShader:`
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
		`};var Qe=class extends le{constructor(e){super({type:`LineMaterial`,uniforms:fe.clone(c.line.uniforms),vertexShader:c.line.vertexShader,fragmentShader:c.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},$e=new i,et=new g,tt=new g,j=new i,M=new i,N=new i,nt=new g,rt=new pe,P=new ke,it=new g,F=new d,I=new Ve,L=new i,R,z;function at(e,t,n){return L.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),L.multiplyScalar(1/L.w),L.x=z/n.width,L.y=z/n.height,L.applyMatrix4(e.projectionMatrixInverse),L.multiplyScalar(1/L.w),Math.abs(Math.max(L.x,L.y))}function ot(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){P.start.fromBufferAttribute(i,r),P.end.fromBufferAttribute(a,r),P.applyMatrix4(n);let o=new g,s=new g;R.distanceSqToSegment(P.start,P.end,s,o),s.distanceTo(o)<z*.5&&t.push({point:s,pointOnLine:o,distance:R.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function st(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;R.at(1,N),N.w=1,N.applyMatrix4(t.matrixWorldInverse),N.applyMatrix4(r),N.multiplyScalar(1/N.w),N.x*=i.x/2,N.y*=i.y/2,N.z=0,nt.copy(N),rt.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(j.fromBufferAttribute(s,t),M.fromBufferAttribute(c,t),j.w=1,M.w=1,j.applyMatrix4(rt),M.applyMatrix4(rt),j.z>u&&M.z>u)continue;if(j.z>u){let e=j.z-M.z,t=(j.z-u)/e;j.lerp(M,t)}else if(M.z>u){let e=M.z-j.z,t=(M.z-u)/e;M.lerp(j,t)}j.applyMatrix4(r),M.applyMatrix4(r),j.multiplyScalar(1/j.w),M.multiplyScalar(1/M.w),j.x*=i.x/2,j.y*=i.y/2,M.x*=i.x/2,M.y*=i.y/2,P.start.copy(j),P.start.z=0,P.end.copy(M),P.end.z=0;let o=P.closestPointToPointParameter(nt,!0);P.at(o,it);let l=Ie.lerp(j.z,M.z,o),d=l>=-1&&l<=1,f=nt.distanceTo(it)<z*.5;if(d&&f){P.start.fromBufferAttribute(s,t),P.end.fromBufferAttribute(c,t),P.start.applyMatrix4(a),P.end.applyMatrix4(a);let r=new g,i=new g;R.distanceSqToSegment(P.start,P.end,i,r),n.push({point:i,pointOnLine:r,distance:R.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var ct=class extends T{constructor(e=new Ze,t=new Qe({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)et.fromBufferAttribute(t,e),tt.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+et.distanceTo(tt);let i=new we(r,2,1);return e.setAttribute(`instanceDistanceStart`,new S(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new S(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;if(r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`),n===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;R=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;z=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),I.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?z*.5:at(r,Math.max(r.near,I.distanceToPoint(R.origin)),s.resolution),I.radius+=c,R.intersectsSphere(I)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),F.copy(o.boundingBox).applyMatrix4(a);let l;l=n?z*.5:at(r,Math.max(r.near,F.distanceToPoint(R.origin)),s.resolution),F.expandByScalar(l),R.intersectsBox(F)!==!1&&(n?ot(this,t):st(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport($e),this.material.uniforms.resolution.value.set($e.z,$e.w))}},lt=new Qe({color:16103746,linewidth:1.6,depthTest:!1,transparent:!0,worldUnits:!1}),B=w(),V={x:0,y:0,ok:!1},ut={x:0,y:0,ok:!1};function H(e,t,n,r,i={x:0,y:0,ok:!1}){return B.copy(e).applyMatrix4(t.matrixWorld).project(q.cam),i.x=(B.x+1)/2*n,i.y=(1-B.y)/2*r,i.ok=B.z<1&&B.z>-1,i}var U={},dt=new WeakMap,W=[],ft=[],pt=null,G=null;function mt(){if(pt)return;pt=new ResizeObserver(e=>{for(let t of e){let e=t.target.offsetWidth;e&&dt.set(t.target,{w:e,h:t.target.offsetHeight})}q&&(q.sporco=!0)});let e=new ResizeObserver(()=>{for(let e of[`mechPanel`,`mechInfo`,`mechLegend`,`mechChecks`,`mechScale`]){let t=b(e);U[e]=t&&!t.hidden&&t.offsetWidth?{x0:t.offsetLeft-4,y0:t.offsetTop-4,x1:t.offsetLeft+t.offsetWidth+4,y1:t.offsetTop+t.offsetHeight+4}:null}q&&(q.sporco=!0)});for(let t of[`mechView`,`mechPanel`,`mechInfo`,`mechLegend`,`mechChecks`,`mechScale`])e.observe(b(t));let t=b(`mechLines`);t.innerHTML=``,G=document.createElementNS(`http://www.w3.org/2000/svg`,`path`),G.setAttribute(`stroke`,`#d8d8dc`),G.setAttribute(`stroke-opacity`,`.7`),G.setAttribute(`stroke-width`,`1`),G.setAttribute(`fill`,`none`),t.appendChild(G)}var ht=w(),gt=[w(-55,-2,0),w(55,-2,0),w(-55,18,0),w(55,18,0)],K={x0:0,y0:0,x1:0,y1:0};function _t(){mt();let e=b(`mechTags`),t=b(`mechLines`),n=Ne&&C.etichette&&!(C.ecc>0||C.eccT>0);if(e.style.display=t.style.display=n?``:`none`,!n)return;let r=q.W,i=q.H,a=r<700,o=0,s=_t.ob||=[];for(let e in U){let t=U[e],n=b(e);t&&!n.hidden&&n.style.visibility!==`hidden`&&(s[o++]=t)}if(D&&D.visible){D.updateMatrixWorld(!0),K.x0=K.y0=1/0,K.x1=K.y1=-1/0;for(let e of gt)H(e,D,r,i,V),K.x0=Math.min(K.x0,V.x-4),K.y0=Math.min(K.y0,V.y-4),K.x1=Math.max(K.x1,V.x+4),K.y1=Math.max(K.y1,V.y+4);s[o++]=K}W.length=0;for(let e of Ne.items){e.oss||(e.oss=!0,pt.observe(e.el)),ht.copy(e.a).applyMatrix4(e.parent.matrixWorld);let t=H(e.a,e.parent,r,i,V),n=H(e.l,e.parent,r,i,ut),o=dt.get(e.el);e.show=t.ok&&n.ok&&(!a||e.prim)&&!(C.sez&&ht.x<C.xCut-.5)&&t.x>-20&&t.x<r+20&&t.y>-20&&t.y<i+20,!o||!o.w?(e.el.style.display=e.show?``:`none`,e.el.style.opacity=`0`):e.show?(e.w=o.w,e.h=o.h,e.ax=t.x,e.ay=t.y,e.x=n.x-e.w/2,e.y=n.y-e.h/2,W.push(e)):e.el.style.display=`none`}for(let e=0;e<40;e++){let e=!1;for(let t=0;t<W.length;t++){let n=W[t];for(let r=t+1;r<W.length;r++){let t=W[r],i=Math.min(n.x+n.w,t.x+t.w)-Math.max(n.x,t.x)+4,a=Math.min(n.y+n.h,t.y+t.h)-Math.max(n.y,t.y)+4;if(i>0&&a>0){if(e=!0,a<i){let e=(n.y<t.y?-1:1)*a/2;n.y+=e,t.y-=e}else{let e=(n.x<t.x?-1:1)*i/2;n.x+=e,t.x-=e}}}for(let t=0;t<o;t++){let r=s[t],i=Math.min(n.x+n.w,r.x1)-Math.max(n.x,r.x0),a=Math.min(n.y+n.h,r.y1)-Math.max(n.y,r.y0);i>0&&a>0&&(e=!0,a<i?n.y+=n.y+n.h/2<(r.y0+r.y1)/2?-a:a:n.x+=n.x+n.w/2<(r.x0+r.x1)/2?-i:i)}n.x=Math.max(4,Math.min(r-n.w-4,n.x)),n.y=Math.max(4,Math.min(i-n.h-4,n.y))}if(!e)break}let c=(e,t)=>Math.min(e.x1,t.x1)-Math.max(e.x0,t.x0)>0&&Math.min(e.y1,t.y1)-Math.max(e.y0,t.y0)>0;W.sort((e,t)=>t.prim-e.prim||t.prec-e.prec),ft.length=0;for(let e of W)e.prec=0;let l=``;for(let e of W){let t=e.r||={x0:0,y0:0,x1:0,y1:0};t.x0=e.x-1,t.y0=e.y-1,t.x1=e.x+e.w+1,t.y1=e.y+e.h+1;let n=!1;for(let e of ft)if(c(e,t)){n=!0;break}for(let e=0;!n&&e<o;e++)n=c(s[e],t);if(n){e.el.style.display=`none`;continue}ft.push(t),e.prec=1,e.el.style.display=``,e.el.style.opacity=``,e.el.style.transform=`translate3d(${e.x}px,${e.y}px,0)`;let r=Math.max(e.x,Math.min(e.ax,e.x+e.w)),i=Math.max(e.y,Math.min(e.ay,e.y+e.h)),a=e.ax.toFixed(2),u=e.ay.toFixed(2);l+=`M${a} ${u}L${r.toFixed(2)} ${i.toFixed(2)}M${(e.ax-3).toFixed(2)} ${u}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`}t.setAttribute(`viewBox`,`0 0 ${r} ${i}`),G.setAttribute(`d`,l)}function vt(){let e=b(`mechScale`);if(!C.sez){e.hidden=!0;return}let t={width:q.W,height:q.H},n=w(C.xCut,(O.yTopOut+O.yBotOut)/2,O.zLeftOut),r=n.clone().project(q.cam),i=n.clone().add(w(0,0,10)).project(q.cam),a=n.clone().add(w(0,10,0)).project(q.cam),o=Math.max(Math.hypot((i.x-r.x)*t.width/2,(i.y-r.y)*t.height/2),Math.hypot((a.x-r.x)*t.width/2,(a.y-r.y)*t.height/2))/10,s=[5,10,20,50,100,200].find(e=>e*o>=70)||200,c=b(`mechPanel`);e.style.bottom=(!c.hidden&&U.mechPanel?U.mechPanel.y1-U.mechPanel.y0-8+20:10)+`px`,e.hidden=!1,b(`mechScaleBar`).style.width=(s*o).toFixed(1)+`px`,b(`mechScaleT`).textContent=`${s} mm`}var q=null,J=!1,Y=null;function yt(){let e=b(`mechView`),t=new Me({antialias:!0,powerPreference:`high-performance`});t.setPixelRatio(Math.min(window.devicePixelRatio||1,ne.p.prMax)),t.toneMapping=7,t.toneMappingExposure=1,t.shadowMap.autoUpdate=!1,t.shadowMap.enabled=!0,t.shadowMap.type=1,e.appendChild(t.domElement);let n=new p;n.domElement.id=`mechLabels`,e.appendChild(n.domElement);let i=new be;i.background=new oe(1118740),i.fog=new ge(1118740,2600,9e3);let a=new ae(t);i.environment=a.fromScene(new ee,.04).texture,i.environmentIntensity=.55;let o=new re(16774892,2.6);o.castShadow=!0;let c=ne.p.ombra;o.shadow.mapSize.set(c,c),o.shadow.bias=-3e-4,o.shadow.normalBias=.3,o.shadow.radius=4,Object.assign(o.shadow.camera,{left:-300,right:300,top:300,bottom:-300,near:10,far:3e3}),i.add(o),i.add(o.target);let u=new re(15265527,.55);i.add(u),i.add(u.target);let d=new re(16777215,1.1);i.add(d),i.add(d.target);let f=new T(new se(14e3,128),new he({color:1316119,roughness:.62,metalness:0,envMapIntensity:.35}));f.rotation.x=-Math.PI/2,f.receiveShadow=!0,f.name=`studioPavimento`,f.raycast=()=>{};let m=new T(new De(8e3,8e3),new le({name:`StudioGriglia`,transparent:!0,depthWrite:!1,uniforms:{centro:{value:new g}},vertexShader:`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 centro; varying vec3 vW;
      float linea(vec2 p, float passo){ vec2 q = p / passo; vec2 g = abs(fract(q - .5) - .5) / fwidth(q); return 1. - min(min(g.x, g.y), 1.); }
      void main(){ vec2 p = vW.xz; float d = length(p - centro.xz);
        float a = (linea(p, 10.) * .25 + linea(p, 100.) * .75) * (1. - smoothstep(150., 900., d));
        gl_FragColor = vec4(vec3(.26), a * .45);
        #include <colorspace_fragment>
      }`}));m.rotation.x=-Math.PI/2,m.position.y=.5,m.renderOrder=1,m.raycast=()=>{};let v=new Le;v.add(f,m),v.position.y=-335,i.add(v);let y=new ve(30,1,1,2e4),x=new ie(y,t.domElement);x.enableDamping=!0,x.dampingFactor=.1,q={renderer:t,lr:n,scene:i,cam:y,ctl:x,sun:o,fill:u,rim:d,pipe:new s(t,i,y),studio:v,griglia:m,clock:new l,tween:null},Ee.V=q,Ee.dopoBuild=()=>{q.sporco=!0,q.scene.add(h),_(C.trasp),r(C.etichette),At(),$(q.vista||`iso`)},i.add(h),q.ambientePronto=new Ke().loadAsync(`./asset/cielo/studio-1k.webp`).then(e=>{e.colorSpace=Se,e.mapping=303;let t=new be;t.background=e,t.backgroundIntensity=te.studio.Lmax*.055;let n=new T(new ce(5,5,3.2,48,1,!0),new ze({color:new oe(.85,.86,.88),side:1}));n.position.y=-.4,t.add(n),i.environment=a.fromScene(t,0,.1,100).texture,i.environmentIntensity=1,n.geometry.dispose(),n.material.dispose(),e.dispose(),q.sporco=!0}).catch(()=>{}),new ResizeObserver(bt).observe(e)}function bt(){if(!q)return;let e=b(`mechView`),t=Math.max(1,e.clientWidth),n=Math.max(1,e.clientHeight);q.W=t,q.H=n,q.renderer.setSize(t,n),q.lr.setSize(t,n),q.cam.aspect=t/n,q.cam.updateProjectionMatrix(),lt.resolution.set(t,n),q.sporco=!0}function X(e,t,n,r){let i=n.clone().normalize(),a=w().subVectors(t,e).normalize(),o=e.clone().add(n),s=t.clone().add(n),c=a.clone().add(i).normalize().multiplyScalar(2.2),l=[e.clone().addScaledVector(i,1.5),o.clone().addScaledVector(i,2.5),t.clone().addScaledVector(i,1.5),s.clone().addScaledVector(i,2.5),o,s,o.clone().sub(c),o.clone().add(c),s.clone().sub(c),s.clone().add(c)],d=new Ze;d.setPositions(l.flatMap(e=>[e.x,e.y,e.z]));let f=new ct(d,lt);f.renderOrder=999,Y.add(f);let p=document.createElement(`div`);p.className=`mlbl mq`,p.textContent=r??`${Be(e.distanceTo(t),1)} mm`;let ee=new u(p);ee.position.copy(o).add(s).multiplyScalar(.5).addScaledVector(i,3),Y.add(ee)}function Z(e,t){Y&&(x(Y),Y.removeFromParent(),ye(Y)),Y=new Le;let r=O.h,i=n.tubo.spessore;if(e){q.scene.add(Y);let e=t+.1,n=O.cTop+(O.Ro-O.half)/Fe;X(w(e,O.yBotOut,O.zLeftOut),w(e,O.yBotOut,O.zRight),w(0,-16,0)),X(w(e,O.yBotOut,O.zLeftOut),w(e,O.yTopOut,O.zLeftOut),w(0,0,-16)),X(w(e,-r+i,-r),w(e,-r+i,r),w(0,8,0)),X(w(e,n,O.zRuotaMax),w(e,n,O.zRailNear),w(0,34,0),`${Be(O.zRailNear-O.zRuotaMax,1)} mm`)}else xe.add(Y),X(w(-O.xHalf,O.yBotOut,O.zLeftOut),w(O.xHalf,O.yBotOut,O.zLeftOut),q.vista===`alto`?w(0,0,-16):w(0,-16,0)),q.vista!==`alto`&&X(w(-O.xHalf,O.yBotOut,O.zLeftOut),w(-O.xHalf,O.yTopOut,O.zLeftOut),q.vista===`lato`?w(0,0,-16):w(-16,0,0))}function xt(e,t,n,r){let i=e.clone().addScaledVector(t.clone().normalize(),n);q.cam.near=n/50,q.cam.far=n*20,q.cam.updateProjectionMatrix(),r?(q.cam.position.copy(i),q.ctl.target.copy(e),q.ctl.update(),q.tween=null):q.tween={t:0,fp:q.cam.position.clone(),ft:q.ctl.target.clone(),tp:i,tt:e.clone()},q.sun.position.copy(e).add(w(-500,900,-650)),q.sun.target.position.copy(e),q.fill.position.copy(e).add(w(700,300,500)),q.fill.target.position.copy(e),q.rim.position.copy(e).add(w(600,500,900)),q.rim.target.position.copy(e),q.griglia&&q.griglia.material.uniforms.centro.value.copy(e)}var St=new je(w(1,0,0),1e9);function Q(e){q.renderer.clippingPlanes=[St],St.constant=e==null?1e9:-e,q.studio&&(q.studio.visible=e==null)}function $(e=`iso`,t){if(!q)return;let r=C.X,i=(O.yTopOut+O.yBotOut)/2,a=O.zMontante+n.ringhiera.montante,o=(O.zLeftOut+a)/2,s=Math.max(O.yTopOut-O.yBotOut,a-O.zLeftOut,2*O.xHalf)+70,c={iso:[w(-1.1,.8,-1.3),r],fronte:[w(0,0,-1),r],alto:[w(0,1,-1e-4),r],lato:[w(-1,0,0),r],sezione:[w(-1,0,0),r+O.xSt[1]],sezioneMotore:[w(-1,0,0),r]}[e];if(!c)return;q.vista=e;let[l,u]=c,d=e.startsWith(`sezione`);d?(C.sez=!0,C.xCut=u):C.sez||Q(null),C.sez&&(Q(C.xCut),Ct());let f=Math.min(1,q.cam.aspect),p=s/2/Math.tan(q.cam.fov/2*Oe)/f*(e===`iso`?1.5:1.05);xt(w(d?u:r,i,o),l,p,t),Z(C.sez,C.xCut),document.querySelectorAll(`#mechBar [data-v]`).forEach(t=>t.classList.toggle(`on`,t.dataset.v===e))}function Ct(){let e=b(`mechCut`);e&&(e.min=C.X-O.xHalf-20,e.max=C.X+O.xHalf+20,e.value=C.xCut,b(`mechCutT`).textContent=`X ${Be(C.xCut-C.X,1)} mm dal centro`)}function wt(){C.sez=!C.sez,E(`sezione`,C.sez),C.sez?(C.xCut=C.X+O.xSt[1],k(`<label class="mrow">Taglio <input id="mechCut" type="range" step="0.5"><span id="mechCutT"></span></label>`+(C.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:``)),b(`mechCut`).addEventListener(`input`,e=>{C.xCut=+e.target.value,Q(C.xCut),Ct(),Z(!0,C.xCut)}),$(`sezione`)):(Q(null),k(C.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:null),$(`iso`))}function Tt(){C.anim&&Te(),C.espT&&(C.espT=0,E(`esploso`,!1)),C.eccT=C.eccT>0?0:1,E(`eccentrico`,C.eccT>0),C.eccT&&!C.trasp&&_(!0);let e=C.X+O.xSt[1];C.sez=!0,C.xCut=e-3,Q(C.xCut),E(`sezione`,!0),k(null),xt(w(e,O.yShank-4,(n.ruote.inferiore.z+O.zBlk0)/2),w(-1,.25,-.45),105),Z(!0,C.xCut)}function Et(){C.anim&&Te(),C.espT=C.esp=0,_e(0),E(`esploso`,!1),a(!0),C.sez=!1,Q(null),E(`sezione`,!1),k(null),o(n.vista.carrello),C.X0=C.X,C.v=n.animazione.velocita,_(!0),r(!0),m(),$(`iso`)}function Dt(){if(!J)return;let e=Math.min(q.clock.getDelta(),.05),t=!1;if(C.anim){let r=n,i=r.vista.inizio+O.xHalf+10,a=r.vista.inizio+r.vista.lunghezza-O.xHalf-10,s=C.X+C.dir*C.v*e;s>a&&(s=a,C.dir=-1),s<i&&(s=i,C.dir=1),o(s),Re(),t=!0}if(C.esp!==C.espT&&(C.esp+=Math.sign(C.espT-C.esp)*Math.min(Math.abs(C.espT-C.esp),e/1.2),_e(y(C.esp)),t=!0),C.ecc!==C.eccT&&(C.ecc+=Math.sign(C.eccT-C.ecc)*Math.min(Math.abs(C.eccT-C.ecc),e/3),me(C.ecc),C.ecc===0&&Ge(null),t=!0),t&&m(),q.tween){let t=q.tween;t.t=Math.min(1,t.t+e/.8);let n=y(t.t);q.cam.position.lerpVectors(t.fp,t.tp,n),q.ctl.target.lerpVectors(t.ft,t.tt,n),t.t>=1&&(q.tween=null)}let r=q.ctl.update();D&&(D.visible=!C.sez,D.quaternion.copy(xe.quaternion).invert().multiply(q.cam.quaternion),D.children.forEach(e=>{e.isCSS2DObject&&(e.visible=!C.sez)}));let i=[C.X,C.esp,C.ecc,C.sez?C.xCut:`-`,C.trasp,C.etichette,de,Ae,q.vista].join(`|`);requestAnimationFrame(Dt);let a=i!==q.firma;(q.sporco||r||a||t||q.tween)&&((q.sporco||a||t)&&(q.renderer.shadowMap.needsUpdate=!0),q.sporco=!1,q.firma=i,q.pipe.render(),q.lr.render(q.scene,q.cam),_t(),vt())}function Ot(){let e={trasmissione:`Trasmissione`,guide:`Guide`,elettronica:`Elettronica`,acqua:`Acqua`};b(`mechLegend`).innerHTML=Object.entries(n.aspetto.funzioni).map(([t,n])=>`<span><i style="background:${n}"></i>${e[t]||t}</span>`).join(``)+`<span><i style="background:#c9cdd2"></i>Struttura</span>`}function kt(){return q||(yt(),Q(null),At()),q}function At(){h.traverse(e=>{e.isMesh&&!e.material.transparent&&(e.geometry.boundingSphere||e.geometry.computeBoundingSphere(),e.geometry.boundingSphere.radius<6&&(e.castShadow=!1))})}function jt(e){let t=Ce(`petg`);t.transparent=e,t.opacity=e?ue.petg.opacity:1,t.depthWrite=!e,t.needsUpdate=!0,h.traverse(n=>{n.isMesh&&n.material===t&&(n.castShadow=!e,n.receiveShadow=!e)})}async function Mt(){kt(),Ce(`petg`),await q.ambientePronto;let e=await Ye(q.renderer,q.scene,q.cam,[{nome:`box opaca`,applica(){jt(!1)},ripristina(){jt(!0)}},{nome:`quote`,applica(){let e=new Ze;e.setPositions([0,0,0,1,1,1]),this.l=new ct(e,lt),q.scene.add(this.l)},ripristina(){this.l.removeFromParent()}}]);return xt(w(C.X,0,0),w(-1.1,.8,-1.3),600,!0),q.renderer.shadowMap.needsUpdate=!0,jt(!1),q.pipe.render(),q.renderer.shadowMap.needsUpdate=!0,jt(!0),q.pipe.render(),e.log.push(`ombre: `+q.renderer.info.programs.length+` programmi`),e}var Nt=!1;function Pt(){b(`mech`).hidden=!1,b(`bMecc`).classList.add(`on`),b(`bSistema`).classList.remove(`on`),Nt||(Nt=!0,b(`mechChecks`).hidden=!0,b(`mechCk`).hidden=!qe,b(`mechSub`).textContent=qe?`Gemello digitale · misure in mm da CONFIG`:`Gemello digitale del meccanismo`,Ot(),kt(),_(!0),r(!0)),bt(),$(`iso`,!0),q.sporco=!0,J||(J=!0,q.clock.getDelta(),requestAnimationFrame(Dt)),q.precompilato||(q.precompilato=!0,Mt().then(()=>{_(C.trasp),C.eccT||$(q.vista||`iso`,!0),q.sporco=!0}).catch(()=>{}))}function Ft(){b(`mech`).hidden=!0,J=!1,b(`bMecc`).classList.remove(`on`),b(`bSistema`).classList.add(`on`),location.hash===`#meccanismo`&&history.replaceState(null,``,location.pathname+location.search)}b(`mechClose`).addEventListener(`click`,Ft),b(`mechCk`).addEventListener(`click`,()=>{let e=b(`mechChecks`);e.hidden=!e.hidden}),b(`mechColor`).addEventListener(`click`,()=>{He(!de),q&&(q.sporco=!0)}),b(`mechBar`).addEventListener(`click`,e=>{let n=e.target.closest(`button`);n&&(q&&(q.sporco=!0),n.dataset.v?(C.sez&&!n.dataset.v.startsWith(`sezione`)&&(C.sez=!1,Q(null),E(`sezione`,!1),k(C.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:null)),$(n.dataset.v)):{animazione:Te,esploso:t,sezione:wt,eccentrico:Tt,etichette:()=>r(!C.etichette),trasparenza:()=>_(!C.trasp),reset:Et}[n.dataset.a]?.())});export{Z as buildDims,xt as camTo,Ft as close,X as dim,yt as initView,vt as layoutScale,_t as layoutTags,Ot as legend,Dt as loop,Pt as open,Mt as precompilaGemello,kt as prepara,Et as reset,bt as resizeView,H as scr,Q as setClip,Ct as syncSezioneUI,Tt as toggleEcc,wt as toggleSezione,$ as view};