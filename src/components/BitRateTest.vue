<template>
	<div>
		<h1>SampleVideo {{resolution}} {{status}}</h1>
		<h2>Now Working : {{recLib}}</h2>
		<h2 v-if="blobCount > 0">Blob Chunk Count : {{blobCount}}</h2>

		<div class="wrapper">
			<div>
				<fieldset>
					<legend>Select Recordr</legend>
					<button @click="setRecLib($event,'recordrtc')">RecordRTC</button>
					<button @click="setRecLib($event, 'msr')">streamproc/MediaStreamRecorder</button>
				</fieldset>

				<fieldset>
					<legend>set width and height</legend>
					<select v-model="resolution">
						<option
							v-for="(option, idx) in resolutionList"
							:key="idx"
							:value="option.value"
						>{{ option.key }}</option>
					</select>
				</fieldset>

				<fieldset>
					<legend>select Bitrate</legend>
					<select v-model="bitrate">
						<option v-for="(option, idx) in bitrateList" :key="idx" :value="option.value">{{ option.key }}</option>
					</select>
				</fieldset>
				<fieldset>
					<legend>Start Record</legend>

					<!-- 영상만 녹화 -->
					<button @click="videoRecording">영상만 녹화하기</button>
					<button @click="screenRecording">스크린 녹화하기</button>
				</fieldset>

				<fieldset>
					<legend>Save Option - TimeSlice에서만 동작하는 옵션</legend>
					<select v-model="saveOpt">
						<option v-for="(option, idx) in saveOptList" :key="idx" :value="option.value">{{option.key}}</option>
					</select>
				</fieldset>

				<fieldset>
					<legend>Start Record(Timeslice mode)</legend>
					<button @click="videoRecording($event, timeslice = true)">영상 녹화 (Timeslice)</button>
					<button @click="screenRecording($event, timeslice = true)">스크린 녹화 (Timeslice)</button>
					timeslice ms
					<input v-model="timeSliceValue" placeholder="timeslice second(ms)" />
					<!-- end Timer ->
					<input v-model="endTimer" placeholder="end timer" /> -->
				</fieldset>

				<fieldset>
					<legend>Stop</legend>
					<button @click="stopMultiRecorder">stop Multi</button>
					<button @click="sendMessage">sendMessage</button>
				</fieldset>

				<!-- <fieldset>
					<legend>Special Button</legend>
					<button @click="recordOneHour">Record One Hour</button>
				</fieldset> -->

				<div class="wrapper">
					<fieldset>
						<legend>worker</legend>
						<div>
							<button @click="toggleWorkerVideo()">Toggle Video</button>
							<button @click="toggleWorkerSound()">Toggle Audio</button>
						</div>
						<video
							ref="workerStream"
							autoplay
							:srcObject.prop="cameraStream"
							style="width:640px; height:480px;"
						></video>
					</fieldset>

					<fieldset>
						<legend>Audio Set</legend>
						<div>
							1
							<button @click="play($event,'remoteStream1')">Play</button>
							<button @click="stop($event,'remoteStream1')">Stop</button>
							<!-- <button @click="toggleRemoteVideo($event,'remoteStream1')">Toggle Video</button> -->
							<button @click="toggleRemoteSound($event,'remoteStream1')">Toggle Audio</button>
							<video
								src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
								ref="remoteStream1"
								style="width:100px; height:100px"
								loop="true"
								crossorigin="anonymous"
							></video>
						</div>
						<div>
							2
							<button @click="play($event,'remoteStream2')">Play</button>
							<button @click="stop($event,'remoteStream2')">Stop</button>
							<!-- <button @click="toggleRemoteVideo($event,'remoteStream2')">Toggle Video</button> -->
							<button @click="toggleRemoteSound($event,'remoteStream2')">Toggle Audio</button>
							<video
								src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
								ref="remoteStream2"
								style="width:100px; height:100px"
								loop="true"
								crossorigin="anonymous"
							></video>
						</div>
						<div>
							3
							<button @click="play($event,'remoteStream3')">Play</button>
							<button @click="stop($event,'remoteStream3')">Stop</button>
							<!-- <button @click="toggleRemoteVideo($event,'remoteStream3')">Toggle Video</button> -->
							<button @click="toggleRemoteSound($event,'remoteStream3')">Toggle Audio</button>
							<video
								src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
								ref="remoteStream3"
								style="width:100px; height:100px"
								loop="true"
								crossorigin="anonymous"
							></video>
						</div>
					</fieldset>
				</div>
			</div>
			<div>
				<fieldset>
					<legend>Status</legend>
					<h3>Worker Video : {{workerVideoStatus}}</h3>
					<h3>Worker Audio : {{workerAudioStatus}}</h3>
					<br />
					<h3>Remote Stream1 Audio : {{remote1AudioStatus}}</h3>
					<br />
					<h3>Remote Stream2 Audio : {{remote2AudioStatus}}</h3>
					<br />
					<h3>Remote Stream3 Audio : {{remote3AudioStatus}}</h3>
				</fieldset>
			</div>
		</div>
	</div>
</template>

<script>
import RecordRTC from "recordrtc";
import io from "socket.io-client";
import IDBHelper from "../utils/IDBHelper.js";
import { v4 as uuidv4 } from "uuid";

import MSR from "../utils/MediaStreamRecorder/MediaStreamRecorder.js";

export default {
	data() {
		return {
			recLib: "recordrtc",
			recorderType: null,

			msrObj: {},

			option: {
				type: "video",
				//mimeType: "video/webm",

				//WhammyRecorder에서만 동작하는 옵션임
				// canvas: {
				// 	width: 1234,
				// 	height: 678
				// }
			},
			mimeType: "video/webm;codecs=vp9",
			//mimeType: "video/webm",
			fileName: "test.mp4",
			uuid: "",
			stream: null,
			screenStream: null,
			cameraStream: null,

			//stream status
			workerVideoStatus: true,
			workerAudioStatus: true,

			remote1VideoStatus: true,
			remote1AudioStatus: true,

			remote2VideoStatus: true,
			remote2AudioStatus: true,

			remote3VideoStatus: true,
			remote3AudioStatus: true,

			remoteStream1: null,
			remoteStream2: null,
			remoteStream3: null,

			recorder: null,
			multiRecorder: null,
			bitrate: 1000000,
			resolution: "720p",
			width: 640,
			height: 480,
			status: "Idle",
			chunkEnd: false,
			blobCount: 0,
			timeSliceValue: 5000,
			endTimer: 0,
			saveOpt: "",
			resolutionList: [
				{
					key: "360p - 480 x 360",
					value: "360p"
				},
				{
					key: "480p - 640 x 480",
					value: "480p"
				},
				{
					key: "720p - 1280 x 720",
					value: "720p"
				},
				{
					key: "1080p - 1920 x 1080",
					value: "1080p"
				}
			],
			bitrateList: [
				{
					key: "16kbit/s - 화상전화 품질",
					value: 16000
				},
				{
					key: "64kbit/s",
					value: 64000
				},
				{
					key: "128kbit/s - 화상회의 품질",
					value: 128000
				},
				{
					key: "256kbit/s",
					value: 256000
				},
				{
					key: "400kbit/s - YouTube 240p",
					value: 400000
				},
				{
					key: "750kbit/s - YouTube 360p",
					value: 750000
				},
				{
					key: "1Mbit/s - YouTube 480p",
					value: 1000000
				},
				{
					key: "2.5Mbit/s - YouTube 720p",
					value: 2500000
				},
				{
					key: "3.8Mbit/s - YouTube 720p60FPS",
					value: 3800000
				},
				{
					key: "4.5Mbit/s - YouTube 1280p",
					value: 4500000
				}
			],
			saveOptList: [
				{
					key: "파일로 저장하기",
					value: "file"
				},
				{
					key: "배열에 저장",
					value: "array"
				},
				{
					key: "indexed db에 저장",
					value: "idb"
				},
				// {
				// 	key: "FileSystem에 저장",
				// 	value: "fileSystem""
				// }
			],
			socket: null,
			chunkArray: []
		};
	},
	watch: {
		resolution: {
			handler(newRes, oldRes) {
				const selectedRes = newRes === undefined ? oldRes : newRes;

				switch (selectedRes) {
					case "360p":
						this.width = 480;
						this.height = 360;
						break;
					case "480p":
						this.width = 640;
						this.height = 480;
						break;
					case "720p":
						this.width = 1280;
						this.height = 720;
						break;
					case "1080p":
						this.width = 1920;
						this.height = 1080;
						break;
					default:
						console.log("Wrong Res!!!");
				}
			},
			immediate: true
		}
	},
	components: {},
	methods: {
		async init() {
			IDBHelper.initIDB();
			this.uuid = uuidv4();

			const constraints = {
				audio: true,
				video: true
			};
			this.socket = io("http://localhost:8080");
			this.socket.on("recMsg", function(data) {
				console.log(data.comment);
			});
			this.socket.on("recMedia", function(data) {
				console.log(data.media);

				let blob = new Blob([data.media], {
					tpye: "video/x-matroska;codecs=avc1,opus"
				});

				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.bitrate);
			});

			try {
				this.cameraStream = await navigator.mediaDevices.getUserMedia(
					constraints
				);

				this.remoteStream1 = this.$refs["remoteStream1"].captureStream();
				this.remoteStream2 = this.$refs["remoteStream2"].captureStream();
				this.remoteStream3 = this.$refs["remoteStream3"].captureStream();
			} catch (err) {
				console.log(err);
			}
		},
		async timerRecord() {
			this.startRecord();
			const sleep = m => new Promise(r => setTimeout(r, m));
			await sleep(10000);
			this.stopRecord();
		},
		// async recordOneHour() {
		// 	this.status = "Recording";
		// 	this.chunkEnd = false;
		// 	this.option.bitsPerSecond = this.bitrate;
		// 	this.option.recorderType = this.recorderType;

		// 	this.option.timeSlice = Number.parseInt(60000, 10);
		// 	this.option.onTimeStamp = timestamp => {
		// 		console.log(timestamp);
		// 	};

		// 	this.option.ondataavailable = blob => {
		// 		console.log("ondataavailable blob:: ", blob);
		// 		if (this.status === "Stopped") {
		// 			this.chunkEnd = true;
		// 		}
		// 		this.socket.emit("media_chunk", {
		// 			chunkIndex: this.blobCount,
		// 			chunk: blob,
		// 			isEnd: this.chunkEnd
		// 		});

		// 		this.blobCount++;
		// 	};

		// 	this.recorder = new RecordRTC.RecordRTCPromisesHandler(
		// 		this.stream,
		// 		this.option
		// 	);
		// 	this.recorder.startRecording();

		// 	const sleep = m => new Promise(r => setTimeout(r, m));
		// 	await sleep(3600000);
		// 	this.stopRecord(null, true);
		// },
		sendMessage() {
			this.socket.emit("msg", { comment: "hi" });
		},

		sendClientMemoryStatus() {
			const memory = window.performance.memory;
			this.socket.emit("client_memory_stats", {
				jsHeapSizeLimit: memory.jsHeapSizeLimit,
				totalJSHeapSize: memory.totalJSHeapSize,
				usedJSHeapSize: memory.usedJSHeapSize
			});
		},
		setRecordType($event, selectedRecordType) {
			console.log(selectedRecordType);
			switch (selectedRecordType) {
				case "MediaStreamRecorder":
					this.recorderType = RecordRTC.MediaStreamRecorder;
					break;
				case "StereoAudioRecorder":
					this.recorderType = RecordRTC.StereoAudioRecorder;
					break;
				case "WebAssemblyRecorder":
					this.recorderType = RecordRTC.WebAssemblyRecorder;
					break;
				case "CanvasRecorder":
					this.recorderType = RecordRTC.CanvasRecorder;
					break;
				case "GifRecorder":
					this.recorderType = RecordRTC.GifRecorder;
					break;
				case "WhammyRecorder":
					this.recorderType = RecordRTC.WhammyRecorder;
					break;
				case "MultiStreamRecorder":
					this.recorderType = RecordRTC.MultiStreamRecorder;
					break;
			}
			console.log(this.recorderType);
		},
		play($event, refName) {
			this.$refs[refName].play();
		},
		stop($event, refName) {
			this.$refs[refName].pause();
		},

		stopMultiRecorder() {
			this.status = "Stopped";

			this.stop('','remoteStream1')
			this.stop('','remoteStream2')
			this.stop('','remoteStream3')

			const stopCallback = this.getMultiRecorderStopCallBack(this.saveOpt);

			if (this.recLib === "recordrtc") {
				this.multiRecorder.stop(stopCallback);
			} else if (this.recLib === "msr") {
				console.log(this.multiRecorder);

				this.multiRecorder.stop();
			}

			this.multiRecorder = null;
		},

		async videoRecording($event, timeslice) {
			console.log("Record start videoRecording");

			await this.startRecorder("", timeslice);
		},
		async screenRecording($event, timeslice) {
			console.log("Record start screenRecording");

			await this.startRecorder("screen", timeslice);
		},

		getMultiRecorderStopCallBack(saveOpt) {
			let stopCallback = () => {};

			if (saveOpt === "file") {
				//아무것도 하지 않음
				return stopCallback;
			} else if (saveOpt === "array") {
				console.log("callback set array");
				stopCallback = () => {
					console.log("stopCallback Called :: array");
					if (this.chunkArray.length > 0) {
						var blob = new File(this.chunkArray, this.fileName, {
							type: this.mimeType
						});
						console.log("chunkarray blobs::", blob);
						RecordRTC.invokeSaveAsDialog(blob, this.fileName + this.bitrate);
					}
				};
			} else if (saveOpt === "idb") {
				stopCallback = async () => {
					//indexed db에서 blob 불러옴
					const queryResult = await IDBHelper.getMediaChunkArray(this.uuid);
					const blobArray = [];

					queryResult.forEach(record => {
						blobArray.push(record.blob);
					});

					var blob = new File(blobArray, this.fileName, {
						type: this.mimeType
					});

					RecordRTC.invokeSaveAsDialog(blob, this.fileName);
				};
			} else {
				stopCallback = blob => {
					RecordRTC.invokeSaveAsDialog(blob, this.fileName);
				};
			}

			return stopCallback;
		},

		getOndataavailable(saveOpt) {
			let ondataavailable = blob => {
				console.log(blob);
			};

			if (saveOpt === "file") {
				if (this.recLib === "recordrtc") {
					ondataavailable = blob => {
						console.log("file", blob);
						RecordRTC.invokeSaveAsDialog(blob, this.fileName);
						this.blobCount++;
					};
				} else if (this.recLib === "msr") {
					ondataavailable = blob => {
						RecordRTC.invokeSaveAsDialog(blob, this.fileName);
						this.blobCount++;
					};
				}
			} else if (saveOpt === "array") {
				ondataavailable = blob => {
					console.log("array", blob);
					this.chunkArray.push(blob);
					this.blobCount++;
				};
			} else if (saveOpt === "idb") {
				ondataavailable = blob => {
					console.log("idb", blob);
					IDBHelper.addMediaChunk(
						this.uuid,
						this.blobCount,
						this.fileName,
						blob
					);

					this.blobCount++;
				};
			}
			return ondataavailable;
		},
		/**
		 * 스트림 배열을 리턴합니다.
		 */
		getStreamArray(recTarget) {
			const streamArray = [];

			this.remoteStream1 = this.$refs["remoteStream1"].captureStream();
			this.remoteStream2 = this.$refs["remoteStream2"].captureStream();
			this.remoteStream3 = this.$refs["remoteStream3"].captureStream();

			console.log(this.remoteStream1.getAudioTracks());
			console.log(this.remoteStream2.getAudioTracks());
			console.log(this.remoteStream3.getAudioTracks());

			const remoteAudioStream1 = new MediaStream();
			const remoteAudioStream2 = new MediaStream();
			const remoteAudioStream3 = new MediaStream();

			const screenAudioStream = new MediaStream();

			remoteAudioStream1.addTrack(this.remoteStream1.getAudioTracks()[0]);
			remoteAudioStream2.addTrack(this.remoteStream2.getAudioTracks()[0]);
			remoteAudioStream3.addTrack(this.remoteStream3.getAudioTracks()[0]);

			//스크린 캡쳐는 오디오를 별도로 스트림에 추가해주어야한다.
			//스트린 캡쳐시 별도로 녹음이 안되기 때문
			screenAudioStream.addTrack(this.cameraStream.getAudioTracks()[0]);

			if (recTarget === "screen") {
				streamArray.push(this.screenStream);
			} else {
				streamArray.push(this.cameraStream);
			}

			streamArray.push(remoteAudioStream1);
			streamArray.push(remoteAudioStream2);
			streamArray.push(remoteAudioStream3);

			if (recTarget === "screen") {
				streamArray.push(screenAudioStream);
			}

			return streamArray;
		},
		async setScreenCapture() {
			const displayStream = await navigator.mediaDevices.getDisplayMedia({
				video:{
					width: this.width,
					height: this.height,
					frameRate: 60
				}
			});
			this.screenStream = displayStream;
			console.log(displayStream);
		},
		setRecLib($event, lib) {
			this.recLib = lib;
		},
		async startRecorder(recTarget, timeslice) {
			this.status = "Recording";
			this.chunkArray = [];

			this.play('','remoteStream1')
			this.play('','remoteStream2')
			this.play('','remoteStream3')

			const option = {
				video: {
					width: this.width,
					height: this.height
				},
				mimeType: this.mimeType,
				bitsPerSecond: this.bitrate
			};

			if (timeslice) {
				if (this.checkSaveOpt()) {
					option.ondataavailable = this.getOndataavailable(this.saveOpt);
					option.timeSlice = Number.parseInt(this.timeSliceValue, 10);
				} else {
					return false;
				}
			}

			if (recTarget === "screen") {
				await this.setScreenCapture();
			} 

			const streamArray = this.getStreamArray(recTarget);

			switch (this.recLib) {
				case "recordrtc":
					this.multiRecorder = new RecordRTC.MultiStreamRecorder(
						streamArray,
						option
					);
					this.multiRecorder.record();
					break;
				case "msr":
					this.multiRecorder = new MSR.MultiStreamRecorder(streamArray, option);
					this.multiRecorder.videoBitsPerSecond = this.bitrate;
					this.multiRecorder.bitsPerSecond = this.bitrate;
					this.multiRecorder.mimeType = this.mimeType;

					if (timeslice) {
						this.multiRecorder.ondataavailable = this.getOndataavailable(
							this.saveOpt
						);
						const stopCallback = this.getMultiRecorderStopCallBack(
							this.saveOpt
						);
						this.multiRecorder.onstop = stopCallback;
						this.multiRecorder.start(Number.parseInt(this.timeSliceValue, 10));
					} else {
						//msr은 stop() 호출시 ondataavailable가 호출된다.
						//bug!! msr은 현재 stop 호출하면 ondataavailable이 두번 호출됨
						this.multiRecorder.ondataavailable = blob => {
							//RecordRTC.invokeSaveAsDialog(blob, this.fileName);
							this.chunkArray.push(blob);
						};
						this.multiRecorder.onstop = () => {
							var blob = new File(this.chunkArray, this.fileName, {
								type: this.mimeType
							});
							RecordRTC.invokeSaveAsDialog(blob, this.fileName);
						};
						this.multiRecorder.start();
					}
					break;
				default:
					console.log("wrong rec lib");
					break;
			}
			console.log(this.multiRecorder);
		},
		checkSaveOpt() {
			if (this.saveOpt === "") {
				alert("Save Option을 먼저 지정해주세요");
				return false;
			}
			return true;
		},
		toggleWorkerVideo() {
			const videoTrack = this.cameraStream.getVideoTracks()[0];
			videoTrack.enabled = !videoTrack.enabled;
			this.workerVideoStatus = videoTrack.enabled;
		},
		toggleWorkerSound() {
			const audioTrack = this.cameraStream.getAudioTracks()[0];
			audioTrack.enabled = !audioTrack.enabled;
			this.workerAudioStatus = audioTrack.enabled;
		},
		toggleRemoteVideo($event, refName) {
			let videoTrack = null;
			switch (refName) {
				case "remoteStream1":
					videoTrack = this.remoteStream1.getVideoTracks()[0];
					break;
				case "remoteStream2":
					videoTrack = this.remoteStream2.getVideoTracks()[0];
					break;
				case "remoteStream3":
					videoTrack = this.remoteStream3.getVideoTracks()[0];
					break;
				default:
					console.log("Wrong refName");
					break;
			}
			videoTrack.enabled = !videoTrack.enabled;
			console.log(refName + " videoTrack ::" + videoTrack.enabled);
		},
		toggleRemoteSound($event, refName) {
			let audioTrack = null;
			this.$refs[refName].muted = !this.$refs[refName].muted;

			//현 시점에서는 필요 없는 코드
			switch (refName) {
				case "remoteStream1":
					audioTrack = this.remoteStream1.getAudioTracks()[0];
					this.remote1AudioStatus = !this.$refs[refName].muted;
					break;
				case "remoteStream2":
					audioTrack = this.remoteStream2.getAudioTracks()[0];
					this.remote2AudioStatus = !this.$refs[refName].muted;
					break;
				case "remoteStream3":
					audioTrack = this.remoteStream3.getAudioTracks()[0];
					this.remote3AudioStatus = !this.$refs[refName].muted;
					break;
				default:
					console.log("Wrong refName");
					break;
			}
			audioTrack.enabled = !audioTrack.enabled;

			console.log(refName + " audioTrack ::" + audioTrack.enabled);
			console.log(refName + " audioTrack muted ::" + this.$refs[refName].muted);
		}
	},
	created() {
		this.init();
	}
};
</script>

<style lang="scss">
.wrapper {
	display: flex;
}
</style>
