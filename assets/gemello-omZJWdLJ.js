import{A as e,At as t,B as n,Bt as r,C as i,D as a,Dt as o,E as s,Et as c,F as l,Ft as u,Gt as d,Ht as f,I as ee,It as te,Kt as p,Lt as ne,M as m,Mt as re,N as h,Nt as ie,O as g,Ot as _,P as ae,Pt as oe,Rt as se,S as v,St as ce,T as le,Tt as ue,Ut as y,Vt as de,Wt as b,_ as fe,_t as pe,a as x,at as me,b as S,bt as he,c as ge,ct as _e,d as ve,dt as ye,et as be,f as xe,ft as C,g as Se,gt as Ce,h as we,ht as Te,i as Ee,it as De,j as Oe,jt as ke,k as Ae,kt as je,l as Me,lt as Ne,m as Pe,mt as Fe,n as Ie,nt as Le,o as Re,ot as w,p as T,pt as ze,r as Be,rt as Ve,s as E,st as D,t as O,tt as He,u as Ue,ut as We,v as Ge,w as k,wt as Ke,x as A,xt as qe,y as Je,yt as Ye,z as Xe,zt as Ze}from"./index-CIuYJj7Z.js";var Qe=()=>new Promise(e=>window.requestIdleCallback?requestIdleCallback(e,{timeout:500}):setTimeout(e,50));async function $e(e,t,n,r=[],i=null){let a=performance.now(),o=[],s=i===!1?null:i||new d(4,4,{type:1016});for(let i of[{nome:`base`,applica(){},ripristina(){}},...r]){await Qe();let r;i.applica();let a=e.getRenderTarget();try{e.setRenderTarget(s),r=i.g?e.compileAsync(i.g,i.camera||n,t):e.compileAsync(t,i.camera||n)}finally{e.setRenderTarget(a),i.ripristina()}await r,o.push(`${i.nome}: ${e.info.programs.length} programmi`)}return s&&!i&&s.dispose(),{ms:performance.now()-a,log:o}}var et=new Fe,tt=new y,nt=class extends Ke{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new he([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new he([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new ue(t,6,1);return this.setAttribute(`instanceStart`,new c(n,3,0)),this.setAttribute(`instanceEnd`,new c(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new ue(t,6,1);return this.setAttribute(`instanceColorStart`,new c(n,3,0)),this.setAttribute(`instanceColorEnd`,new c(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new p(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fe);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),et.setFromBufferAttribute(t),this.boundingBox.union(et))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ze),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)tt.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(tt)),tt.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(tt));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};C.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new f},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},ye.line={uniforms:de.merge([C.common,C.fog,C.line]),vertexShader:`
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
		`};var rt=class extends se{constructor(e){super({type:`LineMaterial`,uniforms:de.clone(ye.line.uniforms),vertexShader:ye.line.vertexShader,fragmentShader:ye.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},it=new b,at=new y,ot=new y,j=new b,M=new b,N=new b,st=new y,ct=new je,P=new o,lt=new y,F=new Fe,I=new Ze,L=new b,R,z;function ut(e,t,n){return L.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),L.multiplyScalar(1/L.w),L.x=z/n.width,L.y=z/n.height,L.applyMatrix4(e.projectionMatrixInverse),L.multiplyScalar(1/L.w),Math.abs(Math.max(L.x,L.y))}function dt(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){P.start.fromBufferAttribute(i,r),P.end.fromBufferAttribute(a,r),P.applyMatrix4(n);let o=new y,s=new y;R.distanceSqToSegment(P.start,P.end,s,o),s.distanceTo(o)<z*.5&&t.push({point:s,pointOnLine:o,distance:R.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function ft(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;R.at(1,N),N.w=1,N.applyMatrix4(t.matrixWorldInverse),N.applyMatrix4(r),N.multiplyScalar(1/N.w),N.x*=i.x/2,N.y*=i.y/2,N.z=0,st.copy(N),ct.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(j.fromBufferAttribute(s,t),M.fromBufferAttribute(c,t),j.w=1,M.w=1,j.applyMatrix4(ct),M.applyMatrix4(ct),j.z>u&&M.z>u)continue;if(j.z>u){let e=j.z-M.z,t=(j.z-u)/e;j.lerp(M,t)}else if(M.z>u){let e=M.z-j.z,t=(M.z-u)/e;M.lerp(j,t)}j.applyMatrix4(r),M.applyMatrix4(r),j.multiplyScalar(1/j.w),M.multiplyScalar(1/M.w),j.x*=i.x/2,j.y*=i.y/2,M.x*=i.x/2,M.y*=i.y/2,P.start.copy(j),P.start.z=0,P.end.copy(M),P.end.z=0;let o=P.closestPointToPointParameter(st,!0);P.at(o,lt);let l=_.lerp(j.z,M.z,o),d=l>=-1&&l<=1,f=st.distanceTo(lt)<z*.5;if(d&&f){P.start.fromBufferAttribute(s,t),P.end.fromBufferAttribute(c,t),P.start.applyMatrix4(a),P.end.applyMatrix4(a);let r=new y,i=new y;R.distanceSqToSegment(P.start,P.end,i,r),n.push({point:i,pointOnLine:r,distance:R.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var pt=class extends t{constructor(e=new nt,t=new rt({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)at.fromBufferAttribute(t,e),ot.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+at.distanceTo(ot);let i=new ue(r,2,1);return e.setAttribute(`instanceDistanceStart`,new c(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new c(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;if(r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`),n===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;R=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;z=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),I.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?z*.5:ut(r,Math.max(r.near,I.distanceToPoint(R.origin)),s.resolution),I.radius+=c,R.intersectsSphere(I)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),F.copy(o.boundingBox).applyMatrix4(a);let l;l=n?z*.5:ut(r,Math.max(r.near,F.distanceToPoint(R.origin)),s.resolution),F.expandByScalar(l),R.intersectsBox(F)!==!1&&(n?dt(this,t):ft(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(it),this.material.uniforms.resolution.value.set(it.z,it.w))}},mt=new rt({color:16103746,linewidth:1.6,depthTest:!1,transparent:!0,worldUnits:!1}),B=e(),V={x:0,y:0,ok:!1},ht={x:0,y:0,ok:!1};function H(e,t,n,r,i={x:0,y:0,ok:!1}){return B.copy(e).applyMatrix4(t.matrixWorld).project(q.cam),i.x=(B.x+1)/2*n,i.y=(1-B.y)/2*r,i.ok=B.z<1&&B.z>-1,i}var U={},gt=new WeakMap,W=[],_t=[],vt=null,G=null;function yt(){if(vt)return;vt=new ResizeObserver(e=>{for(let t of e){let e=t.target.offsetWidth;e&&gt.set(t.target,{w:e,h:t.target.offsetHeight})}q&&(q.sporco=!0)});let e=new ResizeObserver(()=>{for(let e of[`mechPanel`,`mechInfo`,`mechLegend`,`mechChecks`,`mechScale`]){let t=D(e);U[e]=t&&!t.hidden&&t.offsetWidth?{x0:t.offsetLeft-4,y0:t.offsetTop-4,x1:t.offsetLeft+t.offsetWidth+4,y1:t.offsetTop+t.offsetHeight+4}:null}q&&(q.sporco=!0)});for(let t of[`mechView`,`mechPanel`,`mechInfo`,`mechLegend`,`mechChecks`,`mechScale`])e.observe(D(t));let t=D(`mechLines`);t.innerHTML=``,G=document.createElementNS(`http://www.w3.org/2000/svg`,`path`),G.setAttribute(`stroke`,`#d8d8dc`),G.setAttribute(`stroke-opacity`,`.7`),G.setAttribute(`stroke-width`,`1`),G.setAttribute(`fill`,`none`),t.appendChild(G)}var bt=e(),xt=[e(-55,-2,0),e(55,-2,0),e(-55,18,0),e(55,18,0)],K={x0:0,y0:0,x1:0,y1:0};function St(){yt();let e=D(`mechTags`),t=D(`mechLines`),n=Ie&&E.etichette&&!(E.ecc>0||E.eccT>0);if(e.style.display=t.style.display=n?``:`none`,!n)return;let r=q.W,i=q.H,a=r<700,o=0,s=St.ob||=[];for(let e in U){let t=U[e],n=D(e);t&&!n.hidden&&n.style.visibility!==`hidden`&&(s[o++]=t)}if(x&&x.visible){x.updateMatrixWorld(!0),K.x0=K.y0=1/0,K.x1=K.y1=-1/0;for(let e of xt)H(e,x,r,i,V),K.x0=Math.min(K.x0,V.x-4),K.y0=Math.min(K.y0,V.y-4),K.x1=Math.max(K.x1,V.x+4),K.y1=Math.max(K.y1,V.y+4);s[o++]=K}W.length=0;for(let e of Ie.items){e.oss||(e.oss=!0,vt.observe(e.el)),bt.copy(e.a).applyMatrix4(e.parent.matrixWorld);let t=H(e.a,e.parent,r,i,V),n=H(e.l,e.parent,r,i,ht),o=gt.get(e.el);e.show=t.ok&&n.ok&&(!a||e.prim)&&!(E.sez&&bt.x<E.xCut-.5)&&t.x>-20&&t.x<r+20&&t.y>-20&&t.y<i+20,!o||!o.w?(e.el.style.display=e.show?``:`none`,e.el.style.opacity=`0`):e.show?(e.w=o.w,e.h=o.h,e.ax=t.x,e.ay=t.y,e.x=n.x-e.w/2,e.y=n.y-e.h/2,W.push(e)):e.el.style.display=`none`}for(let e=0;e<40;e++){let e=!1;for(let t=0;t<W.length;t++){let n=W[t];for(let r=t+1;r<W.length;r++){let t=W[r],i=Math.min(n.x+n.w,t.x+t.w)-Math.max(n.x,t.x)+4,a=Math.min(n.y+n.h,t.y+t.h)-Math.max(n.y,t.y)+4;if(i>0&&a>0){if(e=!0,a<i){let e=(n.y<t.y?-1:1)*a/2;n.y+=e,t.y-=e}else{let e=(n.x<t.x?-1:1)*i/2;n.x+=e,t.x-=e}}}for(let t=0;t<o;t++){let r=s[t],i=Math.min(n.x+n.w,r.x1)-Math.max(n.x,r.x0),a=Math.min(n.y+n.h,r.y1)-Math.max(n.y,r.y0);i>0&&a>0&&(e=!0,a<i?n.y+=n.y+n.h/2<(r.y0+r.y1)/2?-a:a:n.x+=n.x+n.w/2<(r.x0+r.x1)/2?-i:i)}n.x=Math.max(4,Math.min(r-n.w-4,n.x)),n.y=Math.max(4,Math.min(i-n.h-4,n.y))}if(!e)break}let c=(e,t)=>Math.min(e.x1,t.x1)-Math.max(e.x0,t.x0)>0&&Math.min(e.y1,t.y1)-Math.max(e.y0,t.y0)>0;W.sort((e,t)=>t.prim-e.prim||t.prec-e.prec),_t.length=0;for(let e of W)e.prec=0;let l=``;for(let e of W){let t=e.r||={x0:0,y0:0,x1:0,y1:0};t.x0=e.x-1,t.y0=e.y-1,t.x1=e.x+e.w+1,t.y1=e.y+e.h+1;let n=!1;for(let e of _t)if(c(e,t)){n=!0;break}for(let e=0;!n&&e<o;e++)n=c(s[e],t);if(n){e.el.style.display=`none`;continue}_t.push(t),e.prec=1,e.el.style.display=``,e.el.style.opacity=``,e.el.style.transform=`translate3d(${e.x}px,${e.y}px,0)`;let r=Math.max(e.x,Math.min(e.ax,e.x+e.w)),i=Math.max(e.y,Math.min(e.ay,e.y+e.h)),a=e.ax.toFixed(2),u=e.ay.toFixed(2);l+=`M${a} ${u}L${r.toFixed(2)} ${i.toFixed(2)}M${(e.ax-3).toFixed(2)} ${u}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`}t.setAttribute(`viewBox`,`0 0 ${r} ${i}`),G.setAttribute(`d`,l)}function Ct(){let t=D(`mechScale`);if(!E.sez){t.hidden=!0;return}let n={width:q.W,height:q.H},r=e(E.xCut,(O.yTopOut+O.yBotOut)/2,O.zLeftOut),i=r.clone().project(q.cam),a=r.clone().add(e(0,0,10)).project(q.cam),o=r.clone().add(e(0,10,0)).project(q.cam),s=Math.max(Math.hypot((a.x-i.x)*n.width/2,(a.y-i.y)*n.height/2),Math.hypot((o.x-i.x)*n.width/2,(o.y-i.y)*n.height/2))/10,c=[5,10,20,50,100,200].find(e=>e*s>=70)||200,l=D(`mechPanel`);t.style.bottom=(!l.hidden&&U.mechPanel?U.mechPanel.y1-U.mechPanel.y0-8+20:10)+`px`,t.hidden=!1,D(`mechScaleBar`).style.width=(c*s).toFixed(1)+`px`,D(`mechScaleT`).textContent=`${c} mm`}var q=null,J=!1,Y=null;function wt(){let e=D(`mechView`),i=new ze({antialias:!0,powerPreference:`high-performance`});i.setPixelRatio(Math.min(window.devicePixelRatio||1,be.p.prMax)),i.toneMapping=7,i.toneMappingExposure=1,i.shadowMap.autoUpdate=!1,i.shadowMap.enabled=!0,i.shadowMap.type=1,e.appendChild(i.domElement);let a=new Ve;a.domElement.id=`mechLabels`,e.appendChild(a.domElement);let o=new ne;o.background=new Ce(1118740),o.fog=new qe(1118740,2600,9e3);let s=new We(i);o.environment=s.fromScene(new Xe,.04).texture,o.environmentIntensity=.55;let c=new Ye(16774892,2.6);c.castShadow=!0;let l=be.p.ombra;c.shadow.mapSize.set(l,l),c.shadow.bias=-3e-4,c.shadow.normalBias=.3,c.shadow.radius=4,Object.assign(c.shadow.camera,{left:-300,right:300,top:300,bottom:-300,near:10,far:3e3}),o.add(c),o.add(c.target);let d=new Ye(15265527,.55);o.add(d),o.add(d.target);let f=new Ye(16777215,1.1);o.add(f),o.add(f.target);let p=new t(new Te(14e3,128),new re({color:1316119,roughness:.62,metalness:0,envMapIntensity:.35}));p.rotation.x=-Math.PI/2,p.receiveShadow=!0,p.name=`studioPavimento`,p.raycast=()=>{};let m=new t(new u(8e3,8e3),new se({name:`StudioGriglia`,transparent:!0,depthWrite:!1,uniforms:{centro:{value:new y}},vertexShader:`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`uniform vec3 centro; varying vec3 vW;
      float linea(vec2 p, float passo){ vec2 q = p / passo; vec2 g = abs(fract(q - .5) - .5) / fwidth(q); return 1. - min(min(g.x, g.y), 1.); }
      void main(){ vec2 p = vW.xz; float d = length(p - centro.xz);
        float a = (linea(p, 10.) * .25 + linea(p, 100.) * .75) * (1. - smoothstep(150., 900., d));
        gl_FragColor = vec4(vec3(.26), a * .45);
        #include <colorspace_fragment>
      }`}));m.rotation.x=-Math.PI/2,m.position.y=.5,m.renderOrder=1,m.raycast=()=>{};let h=new ce;h.add(p,m),h.position.y=-335,o.add(h);let g=new ie(30,1,1,2e4),_=new De(g,i.domElement);_.enableDamping=!0,_.dampingFactor=.1,q={renderer:i,lr:a,scene:o,cam:g,ctl:_,sun:c,fill:d,rim:f,pipe:new He(i,o,g),studio:h,griglia:m,clock:new _e,tween:null},ge.V=q,ge.dopoBuild=()=>{q.sporco=!0,q.scene.add(A),k(E.trasp),v(E.etichette),Ht(),$(q.vista||`iso`)},o.add(A),q.ambientePronto=new r().loadAsync(`./asset/cielo/studio-1k.webp`).then(e=>{e.colorSpace=te,e.mapping=303;let r=new ne;r.background=e,r.backgroundIntensity=n.studio.Lmax*.055;let i=new t(new pe(5,5,3.2,48,1,!0),new ke({color:new Ce(.85,.86,.88),side:1}));i.position.y=-.4,r.add(i),o.environment=s.fromScene(r,0,.1,100).texture,o.environmentIntensity=1,i.geometry.dispose(),i.material.dispose(),e.dispose(),q.sporco=!0}).catch(()=>{}),new ResizeObserver(At).observe(e),ee(e,i.domElement,()=>({camera:q.cam,controls:q.ctl,richiedi:()=>{q.sporco=!0}})),new ResizeObserver(kt).observe(i.domElement),window.visualViewport&&visualViewport.addEventListener(`resize`,kt)}var X=Oe(),Tt=[`mechPanel`,`mechInfo`,`mechLegend`,`mechChecks`];function Et(){m(D(`mechView`),Tt,X),ae(q.cam,X)}function Dt(e,t,n){return Et(),q.fitRif={w:e,h:t,k:n},q.fitDist=h(q.cam,e,t,X,n)}function Ot(){if(!q||!q.fitRif||D(`mech`).hidden)return;let e=q.fitDist,{w:t,h:n,k:r}=q.fitRif,i=Dt(t,n,r)/e;if(q.sporco=!0,Math.abs(i-1)<.01)return;let a=q.ctl.target,o=q.tween;o?o.tp.sub(o.tt).multiplyScalar(i).add(o.tt):q.tween={t:0,fp:q.cam.position.clone(),ft:a.clone(),tp:q.cam.position.clone().sub(a).multiplyScalar(i).add(a),tt:a.clone()};let s=o?o.tp.distanceTo(o.tt):q.tween.tp.distanceTo(a);q.cam.near=s/50,q.cam.far=s*20,q.cam.updateProjectionMatrix()}var kt=l(Ot,150);function At(){if(!q)return;let e=D(`mechView`),t=Math.max(1,e.clientWidth),n=Math.max(1,e.clientHeight);(t!==q.W||n!==q.H)&&(q.W=t,q.H=n,q.renderer.setSize(t,n),q.lr.setSize(t,n),q.cam.aspect=t/n,X.W=t,X.H=n,ae(q.cam,X),q.cam.updateProjectionMatrix(),mt.resolution.set(t,n),q.sporco=!0)}function Z(t,n,r,i){let a=r.clone().normalize(),o=e().subVectors(n,t).normalize(),s=t.clone().add(r),c=n.clone().add(r),l=o.clone().add(a).normalize().multiplyScalar(2.2),u=[t.clone().addScaledVector(a,1.5),s.clone().addScaledVector(a,2.5),n.clone().addScaledVector(a,1.5),c.clone().addScaledVector(a,2.5),s,c,s.clone().sub(l),s.clone().add(l),c.clone().sub(l),c.clone().add(l)],d=new nt;d.setPositions(u.flatMap(e=>[e.x,e.y,e.z]));let f=new pt(d,mt);f.renderOrder=999,Y.add(f);let ee=document.createElement(`div`);ee.className=`mlbl mq`,ee.textContent=i??`${fe(t.distanceTo(n),1)} mm`;let te=new Le(ee);te.position.copy(s).add(c).multiplyScalar(.5).addScaledVector(a,3),Y.add(te)}function jt(t,n){Y&&(Se(Y),Y.removeFromParent(),we(Y)),Y=new ce;let r=O.h,i=w.tubo.spessore;if(t){q.scene.add(Y);let t=n+.1,a=O.cTop+(O.Ro-O.half)/Re;Z(e(t,O.yBotOut,O.zLeftOut),e(t,O.yBotOut,O.zRight),e(0,-16,0)),Z(e(t,O.yBotOut,O.zLeftOut),e(t,O.yTopOut,O.zLeftOut),e(0,0,-16)),Z(e(t,-r+i,-r),e(t,-r+i,r),e(0,8,0)),Z(e(t,a,O.zRuotaMax),e(t,a,O.zRailNear),e(0,34,0),`${fe(O.zRailNear-O.zRuotaMax,1)} mm`)}else Pe.add(Y),Z(e(-O.xHalf,O.yBotOut,O.zLeftOut),e(O.xHalf,O.yBotOut,O.zLeftOut),q.vista===`alto`?e(0,0,-16):e(0,-16,0)),q.vista!==`alto`&&Z(e(-O.xHalf,O.yBotOut,O.zLeftOut),e(-O.xHalf,O.yTopOut,O.zLeftOut),q.vista===`lato`?e(0,0,-16):e(-16,0,0))}function Mt(t,n,r,i){let a=t.clone().addScaledVector(n.clone().normalize(),r);q.cam.near=r/50,q.cam.far=r*20,q.cam.updateProjectionMatrix(),i?(q.cam.position.copy(a),q.ctl.target.copy(t),q.ctl.update(),q.tween=null):q.tween={t:0,fp:q.cam.position.clone(),ft:q.ctl.target.clone(),tp:a,tt:t.clone()},q.sun.position.copy(t).add(e(-500,900,-650)),q.sun.target.position.copy(t),q.fill.position.copy(t).add(e(700,300,500)),q.fill.target.position.copy(t),q.rim.position.copy(t).add(e(600,500,900)),q.rim.target.position.copy(t),q.griglia&&q.griglia.material.uniforms.centro.value.copy(t)}var Nt=210*Math.tan(15*Math.PI/180),Pt=new oe(e(1,0,0),1e9);function Q(e){q.renderer.clippingPlanes=[Pt],Pt.constant=e==null?1e9:-e,q.studio&&(q.studio.visible=e==null)}function $(t=`iso`,n){if(!q)return;let r=E.X,i=(O.yTopOut+O.yBotOut)/2,a=O.zMontante+w.ringhiera.montante,o=(O.zLeftOut+a)/2,s=Math.max(O.yTopOut-O.yBotOut,a-O.zLeftOut,2*O.xHalf)+70,c={iso:[e(-1.1,.8,-1.3),r],fronte:[e(0,0,-1),r],alto:[e(0,1,-1e-4),r],lato:[e(-1,0,0),r],sezione:[e(-1,0,0),r+O.xSt[1]],sezioneMotore:[e(-1,0,0),r]}[t];if(!c)return;q.vista=t;let[l,u]=c,d=t.startsWith(`sezione`);d?(E.sez=!0,E.xCut=u):E.sez||Q(null),E.sez&&(Q(E.xCut),Ft());let f=Dt(s,s,t===`iso`?1.5:1.1);Mt(e(d?u:r,i,o),l,f,n),jt(E.sez,E.xCut),document.querySelectorAll(`#mechBar [data-v]`).forEach(e=>e.classList.toggle(`on`,e.dataset.v===t))}function Ft(){let e=D(`mechCut`);e&&(e.min=E.X-O.xHalf-20,e.max=E.X+O.xHalf+20,e.value=E.xCut,D(`mechCutT`).textContent=`X ${fe(E.xCut-E.X,1)} mm dal centro`)}function It(){E.sez=!E.sez,T(`sezione`,E.sez),E.sez?(E.xCut=E.X+O.xSt[1],S(`<label class="mrow">Taglio <input id="mechCut" type="range" step="0.5"><span id="mechCutT"></span></label>`+(E.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:``)),D(`mechCut`).addEventListener(`input`,e=>{E.xCut=+e.target.value,Q(E.xCut),Ft(),jt(!0,E.xCut)}),$(`sezione`)):(Q(null),S(E.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:null),$(`iso`))}function Lt(){E.anim&&g(),E.espT&&(E.espT=0,T(`esploso`,!1)),E.eccT=E.eccT>0?0:1,T(`eccentrico`,E.eccT>0),E.eccT&&!E.trasp&&k(!0);let t=E.X+O.xSt[1];E.sez=!0,E.xCut=t-3,Q(E.xCut),T(`sezione`,!0),S(null),Mt(e(t,O.yShank-4,(w.ruote.inferiore.z+O.zBlk0)/2),e(-1,.25,-.45),Dt(Nt,Nt,1)),jt(!0,E.xCut)}function Rt(){E.anim&&g(),E.espT=E.esp=0,ve(0),T(`esploso`,!1),s(!0),E.sez=!1,Q(null),T(`sezione`,!1),S(null),le(w.vista.carrello),E.X0=E.X,E.v=w.animazione.velocita,k(!0),v(!0),a(),$(`iso`)}function zt(){if(!J)return;let e=Math.min(q.clock.getDelta(),.05),t=!1;if(E.anim){let n=w,r=n.vista.inizio+O.xHalf+10,i=n.vista.inizio+n.vista.lunghezza-O.xHalf-10,a=E.X+E.dir*E.v*e;a>i&&(a=i,E.dir=-1),a<r&&(a=r,E.dir=1),le(a),Me(),t=!0}if(E.esp!==E.espT&&(E.esp+=Math.sign(E.espT-E.esp)*Math.min(Math.abs(E.espT-E.esp),e/1.2),ve(Ne(E.esp)),t=!0),E.ecc!==E.eccT&&(E.ecc+=Math.sign(E.eccT-E.ecc)*Math.min(Math.abs(E.eccT-E.ecc),e/3),Ue(E.ecc),E.ecc===0&&Ge(null),t=!0),t&&a(),q.tween){let t=q.tween;t.t=Math.min(1,t.t+e/.8);let n=Ne(t.t);q.cam.position.lerpVectors(t.fp,t.tp,n),q.ctl.target.lerpVectors(t.ft,t.tt,n),t.t>=1&&(q.tween=null)}let n=q.ctl.update();x&&(x.visible=!E.sez,x.quaternion.copy(Pe.quaternion).invert().multiply(q.cam.quaternion),x.children.forEach(e=>{e.isCSS2DObject&&(e.visible=!E.sez)}));let r=[E.X,E.esp,E.ecc,E.sez?E.xCut:`-`,E.trasp,E.etichette,Je,xe,q.vista].join(`|`);requestAnimationFrame(zt);let i=r!==q.firma;(q.sporco||n||i||t||q.tween)&&((q.sporco||i||t)&&(q.renderer.shadowMap.needsUpdate=!0),q.sporco=!1,q.firma=r,q.pipe.render(),q.lr.render(q.scene,q.cam),St(),Ct())}function Bt(){let e={trasmissione:`Trasmissione`,guide:`Guide`,elettronica:`Elettronica`,acqua:`Acqua`};D(`mechLegend`).innerHTML=Object.entries(w.aspetto.funzioni).map(([t,n])=>`<span><i style="background:${n}"></i>${e[t]||t}</span>`).join(``)+`<span><i style="background:#c9cdd2"></i>Struttura</span>`}function Vt(){return q||(wt(),Q(null),Ht()),q}function Ht(){A.traverse(e=>{e.isMesh&&!e.material.transparent&&(e.geometry.boundingSphere||e.geometry.computeBoundingSphere(),e.geometry.boundingSphere.radius<6&&(e.castShadow=!1))})}function Ut(e){let t=Be(`petg`);t.transparent=e,t.opacity=e?Ee.petg.opacity:1,t.depthWrite=!e,t.needsUpdate=!0,A.traverse(n=>{n.isMesh&&n.material===t&&(n.castShadow=!e,n.receiveShadow=!e)})}async function Wt(){Vt(),Be(`petg`),await q.ambientePronto;let t=await $e(q.renderer,q.scene,q.cam,[{nome:`box opaca`,applica(){Ut(!1)},ripristina(){Ut(!0)}},{nome:`quote`,applica(){let e=new nt;e.setPositions([0,0,0,1,1,1]),this.l=new pt(e,mt),q.scene.add(this.l)},ripristina(){this.l.removeFromParent()}}]);return Mt(e(E.X,0,0),e(-1.1,.8,-1.3),600,!0),q.renderer.shadowMap.needsUpdate=!0,Ut(!1),q.pipe.render(),q.renderer.shadowMap.needsUpdate=!0,Ut(!0),q.pipe.render(),t.log.push(`ombre: `+q.renderer.info.programs.length+` programmi`),t}var Gt=!1;function Kt(){D(`mech`).hidden=!1,D(`bMecc`).classList.add(`on`),D(`bSistema`).classList.remove(`on`),Gt||(Gt=!0,D(`mechChecks`).hidden=!0,D(`mechCk`).hidden=!me,D(`mechSub`).textContent=me?`Gemello digitale · misure in mm da CONFIG`:`Gemello digitale del meccanismo`,Bt(),Vt(),k(!0),v(!0)),At(),$(`iso`,!0),q.sporco=!0,J||(J=!0,q.clock.getDelta(),requestAnimationFrame(zt)),q.precompilato||(q.precompilato=!0,Wt().then(()=>{k(E.trasp),E.eccT||$(q.vista||`iso`,!0),q.sporco=!0}).catch(()=>{}))}function qt(){D(`mech`).hidden=!0,J=!1,D(`bMecc`).classList.remove(`on`),D(`bSistema`).classList.add(`on`),location.hash===`#meccanismo`&&history.replaceState(null,``,location.pathname+location.search)}D(`mechClose`).addEventListener(`click`,qt),D(`mechCk`).addEventListener(`click`,()=>{let e=D(`mechChecks`);e.hidden=!e.hidden}),D(`mechColor`).addEventListener(`click`,()=>{i(!Je),q&&(q.sporco=!0)}),D(`mechBar`).addEventListener(`click`,e=>{let t=e.target.closest(`button`);t&&(q&&(q.sporco=!0),t.dataset.v?(E.sez&&!t.dataset.v.startsWith(`sezione`)&&(E.sez=!1,Q(null),T(`sezione`,!1),S(E.anim?`<div class="mrow"><span id="mechCnt"></span></div>`:null)),$(t.dataset.v)):{animazione:g,esploso:Ae,sezione:It,eccentrico:Lt,etichette:()=>v(!E.etichette),trasparenza:()=>k(!E.trasp),reset:Rt}[t.dataset.a]?.())});export{jt as buildDims,Mt as camTo,qt as close,Z as dim,Ot as fitView,wt as initView,Ct as layoutScale,St as layoutTags,Bt as legend,zt as loop,Kt as open,Wt as precompilaGemello,Vt as prepara,Rt as reset,At as resizeView,H as scr,Q as setClip,Ft as syncSezioneUI,Lt as toggleEcc,It as toggleSezione,$ as view};