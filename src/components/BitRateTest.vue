<template>
	<div>
		<h1>SampleVideo {{resolution}} {{status}}</h1>
		<h2 v-if="blobCount > 0">Blob Chunk Count : {{blobCount}}</h2>

		<div>
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
			<!-- <fieldset>
				<legend>Select RecorderType</legend>
				<button @click="setRecordType($event, 'MediaStreamRecorder')">MediaStreamRecorder</button>
				<button @click="setRecordType($event, 'StereoAudioRecorder')">StereoAudioRecorder</button>
				<button @click="setRecordType($event, 'WebAssemblyRecorder')">WebAssemblyRecorder</button>
				<button @click="setRecordType($event, 'CanvasRecorder')">CanvasRecorder</button>
				<button @click="setRecordType($event, 'GifRecorder')">GifRecorder</button>
				<button @click="setRecordType($event, 'WhammyRecorder')">WhammyRecorder</button>
				<button @click="setRecordType($event, 'MultiStreamRecorder')">MultiStreamRecorder</button>
			</fieldset>-->
			<fieldset>
				<legend>Start Record(normal)</legend>
				<button @click="startRecord">start record</button>
				<button @click="timerRecord">start record(10s)</button>
				<button @click="recordWithCustomRes">start record Multi</button>
			</fieldset>

			<fieldset>
				<legend>Start Record(timeslice mode)</legend>
				<button @click="startRecordSaveChunk()">CLIENT - start timeSliceMode And Devided Chunk</button>
				<button
					@click="startRecord($event, timeslice = true, sendServer = false)"
				>CLIENT - start timeSliceMode And Merge Chunk</button>
				<button
					@click="startRecord($event, timeslice = true, sendServer= true)"
				>SERVER - start timeSliceMode And Merge Chunk</button>
				timeslice ms
				<input v-model="timeSliceValue" placeholder="timeslice second(ms)" />
				end Timer ->
				<input v-model="endTimer" placeholder="end timer" />
			</fieldset>

			<fieldset>
				<legend>Stop</legend>
				<button @click="stopRecord($event, timeslice = false)">stop record</button>
				<button @click="stopRecord($event, timeslice = true)">stop timeSliceMode</button>
				<button @click="stopMultiRecorder">stop Multi</button>
				<button @click="sendMessage">sendMessage</button>
			</fieldset>

			<fieldset>
				<legend>Special Button</legend>
				<button @click="recordOneHour">Record One Hour</button>
			</fieldset>

			<fieldset>
				<legend>Screen Capture</legend>
				<button @click="screenCapture">Screen Capture</button>
				<!-- <video autoplay :srcObject.prop="stream" style="width:100px; height:100px"></video> -->
			</fieldset>

			<fieldset>
				<legend>worker</legend>
				<video autoplay :srcObject.prop="cameraStream" style="width:640px; height:480px;"></video>
			</fieldset>

			<fieldset>
				<legend>Audio Set</legend>
				<div>
					1
					<button @click="play($event,'remoteStream1')">Play</button>
					<button @click="stop($event,'remoteStream1')">Stop</button>
					<video
						src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
						ref="remoteStream1"
						style="width:100px; height:100px"
						loop="true"
					></video>
				</div>
				<div>
					2
					<button @click="play($event,'remoteStream2')">Play</button>
					<button @click="stop($event,'remoteStream2')">Stop</button>
					<video
						src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
						ref="remoteStream2"
						style="width:100px; height:100px"
						loop="true"
					></video>
				</div>
				<div>
					3
					<button @click="play($event,'remoteStream3')">Play</button>
					<button @click="stop($event,'remoteStream3')">Stop</button>
					<video
						src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
						ref="remoteStream3"
						style="width:100px; height:100px"
						loop="true"
					></video>
				</div>
			</fieldset>
		</div>
	</div>
</template>

<script>
import RecordRTC from "recordrtc";
import io from "socket.io-client";

export default {
	data() {
		return {
			recorderType: null,
			option: {
				type: "video",
				//mimeType: "video/webm",

				//WhammyRecorder에서만 동작하는 옵션임
				canvas: {
					width: 1234,
					height: 678
				}
			},
			stream: null,
			audioStream : null,
			cameraStream: null,
			recorder: null,
			multiRecorder: null,
			bitrate: 1000000,
			resolution: "480p",
			width: 640,
			height: 480,
			status: "Idle",
			chunkEnd: false,
			blobCount: 0,
			timeSliceValue: 5000,
			endTimer: 0,
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
			const constraints = {
				audio: true,
				video: true
				//video: { width: 1280, height: 720 }
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

			//this.recorderType = RecordRTC.MediaStreamRecorder;

			try {
				this.stream = await navigator.mediaDevices.getUserMedia(constraints);
				this.cameraStream = this.stream;
				this.audioStream = this.stream;
			} catch (err) {
				console.log(err);
			}
		},
		startRecord($event, timeSliceMode, sendServer) {
			this.status = "Recording";
			this.chunkEnd = false;

			this.option.bitsPerSecond = this.bitrate;
			this.option.recorderType = this.recorderType;

			if (timeSliceMode) {
				this.option.timeSlice = Number.parseInt(this.timeSliceValue, 10);
				this.option.onTimeStamp = timestamp => {
					console.log(timestamp);
				};

				if (sendServer) {
					this.option.ondataavailable = blob => {
						console.log("ondataavailable blob:: ", blob);
						if (this.status === "Stopped") {
							this.chunkEnd = true;
						}
						this.socket.emit("media_chunk", {
							chunkIndex: this.blobCount,
							chunk: blob,
							isEnd: this.chunkEnd
						});
						this.blobCount++;
					};
				} else {
					this.option.ondataavailable = blob => {
						this.chunkArray.push(blob);
						this.blobCount++;
						this.sendClientMemoryStatus();
					};
				}
			}
			this.recorder = new RecordRTC.RecordRTCPromisesHandler(
				this.stream,
				this.option
			);
			this.recorder.startRecording();
		},
		startRecordSaveChunk() {
			//reset
			this.status = "Recording";
			this.chunkEnd = false;
			this.blobCount = 0;

			this.option.bitsPerSecond = this.bitrate;
			this.option.recorderType = this.recorderType;
			this.option.timeSlice = Number.parseInt(this.timeSliceValue, 10);
			this.option.onTimeStamp = timestamp => {
				console.log(timestamp);
			};

			this.option.ondataavailable = blob => {
				console.log("ondataavailable blob:: ", blob);

				//RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.bitrate);
				RecordRTC.invokeSaveAsDialog(blob, "test");
				this.blobCount++;
			};

			this.recorder = new RecordRTC.RecordRTCPromisesHandler(
				this.stream,
				this.option
			);
			this.recorder.startRecording();
		},
		async stopRecord($event, timeSliceMode) {
			console.log("stopRecord called :: timeSliceMode ", timeSliceMode);
			this.status = "Stopped";

			await this.recorder.stopRecording();

			if (!timeSliceMode) {
				let blob = await this.recorder.getBlob();
				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.bitrate);
			}

			if (this.chunkArray.length > 0) {
				var blob = new File(this.chunkArray, "video.webm", {
					type: "video/webm"
				});

				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.bitrate);
			}
		},
		async timerRecord() {
			this.startRecord();
			const sleep = m => new Promise(r => setTimeout(r, m));
			await sleep(10000);
			this.stopRecord();
		},
		async recordOneHour() {
			this.status = "Recording";
			this.chunkEnd = false;
			this.option.bitsPerSecond = this.bitrate;
			this.option.recorderType = this.recorderType;

			this.option.timeSlice = Number.parseInt(60000, 10);
			this.option.onTimeStamp = timestamp => {
				console.log(timestamp);
			};

			this.option.ondataavailable = blob => {
				console.log("ondataavailable blob:: ", blob);
				if (this.status === "Stopped") {
					this.chunkEnd = true;
				}
				this.socket.emit("media_chunk", {
					chunkIndex: this.blobCount,
					chunk: blob,
					isEnd: this.chunkEnd
				});

				this.blobCount++;
			};

			this.recorder = new RecordRTC.RecordRTCPromisesHandler(
				this.stream,
				this.option
			);
			this.recorder.startRecording();

			const sleep = m => new Promise(r => setTimeout(r, m));
			await sleep(3600000);
			this.stopRecord(null, true);
		},
		sendMessage() {
			this.socket.emit("msg", { comment: "hi" });
		},
		async screenCapture() {
			const displayStream = await navigator.mediaDevices.getDisplayMedia({
				audio: true,
				video: true
			});
			this.stream = displayStream;
			console.log(displayStream);
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
		recordWithCustomRes() {

			this.audioStream.
			this.multiRecorder = new RecordRTC.MultiStreamRecorder([this.stream, this.audioStream], {
				video: {
					width: this.width,
					height: this.height
				},
				bitsPerSecond: this.bitrate,
				timeSlice: 5000
				// ondataavailable: blob => {
				// 	console.log("ondataavailable blob:: ", blob);

				// 	RecordRTC.invokeSaveAsDialog(blob, "test");
				// 	this.blobCount++;
				// }
			});

			console.log(this.multiRecorder);
			this.multiRecorder.record();
		},
		async stopMultiRecorder() {
			this.multiRecorder.stop(function(blob) {
				RecordRTC.invokeSaveAsDialog(blob, "test");
			});

			
		}
	},
	created() {
		this.init();
	}
};
</script>

<style></style>
