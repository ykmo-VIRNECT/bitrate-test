<template>
	<div>
		<h1>SampleVideo 720p(1280x720) {{status}}</h1>
		<h2 v-if="blobCount > 0">Blob Chunk Count : {{blobCount}}</h2>
		<div>
			<fieldset>
				<legend>Start Record(normal)</legend>
				<button @click="startRecord">start record</button>
				<button @click="timerRecord">start record(10s)</button>
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
				<button @click="sendMessage">sendMessage</button>
			</fieldset>

			<fieldset>
				<legend>Special Button</legend>
				<button @click="recordOneHour">Record One Hour</button>
			</fieldset>

			<fieldset>
				<legend>Screen Capture</legend>
				<button @click="screenCapture">Screen Capture</button>
			</fieldset>

			<div>select Bitrate</div>
			<select v-model="selected">
				<option v-for="(option, idx) in bitrateList" :key="idx" :value="option.value">{{ option.key }}</option>
			</select>
		</div>

		<video autoplay :srcObject.prop="stream"></video>
	</div>
</template>

<script>
import RecordRTC from "recordrtc";
import io from "socket.io-client";

export default {
	data() {
		return {
			stream: null,
			recorder: null,
			selected: 1000000,
			status: "Idle",
			chunkEnd: false,
			blobCount: 0,
			timeSliceValue: 5000,
			endTimer: 0,
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
	components: {},
	methods: {
		async init() {
			const constraints = {
				audio: true,
				video: { width: 1280, height: 720 }
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

				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.selected);
			});
			try {
				this.stream = await navigator.mediaDevices.getUserMedia(constraints);
			} catch (err) {
				console.log(err);
			}
		},
		startRecord($event, timeSliceMode, sendServer) {
			this.status = "Recording";
			this.chunkEnd = false;
			let option = {
				type: "video",
				bitsPerSecond: this.selected,
				mimeType: "video/webm"
			};

			if (timeSliceMode) {
				option.timeSlice = Number.parseInt(this.timeSliceValue, 10);
				option.onTimeStamp = timestamp => {
					console.log(timestamp);
				};

				if (sendServer) {
					option.ondataavailable = blob => {
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
					option.ondataavailable = blob => {
						this.chunkArray.push(blob);
						this.blobCount++;
					};
				}


			}
			this.recorder = new RecordRTC.RecordRTCPromisesHandler(
				this.stream,
				option
			);
			this.recorder.startRecording();
		},
		startRecordSaveChunk() {
			//reset
			this.status = "Recording";
			this.chunkEnd = false;
			this.blobCount = 0;

			let option = {
				type: "video",
				bitsPerSecond: this.selected,
				mimeType: "video/webm"
			};

			option.timeSlice = Number.parseInt(this.timeSliceValue, 10);
			option.onTimeStamp = timestamp => {
				console.log(timestamp);
			};

			option.ondataavailable = blob => {
				console.log("ondataavailable blob:: ", blob);

				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.selected);
				this.blobCount++;
			};

			this.recorder = new RecordRTC.RecordRTCPromisesHandler(
				this.stream,
				option
			);
			this.recorder.startRecording();
		},
		async stopRecord($event, timeSliceMode) {
			console.log("stopRecord called :: timeSliceMode ", timeSliceMode);
			this.status = "Stopped";

			await this.recorder.stopRecording();

			if (!timeSliceMode) {
				let blob = await this.recorder.getBlob();
				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.selected);
			}

			if (this.chunkArray.length > 0) {
				var blob = new File(this.chunkArray, "video.webm", {
					type: "video/webm"
				});

				RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.selected);
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
			let option = {
				type: "video",
				bitsPerSecond: this.selected,
				mimeType: "video/webm"
			};

			option.timeSlice = Number.parseInt(60000, 10);
			option.onTimeStamp = timestamp => {
				console.log(timestamp);
			};

			option.ondataavailable = blob => {
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
				option
			);
			this.recorder.startRecording();

			const sleep = m => new Promise(r => setTimeout(r, m));
			await sleep(3600000);
			this.stopRecord(null, true);
		},
		sendMessage() {
			this.socket.emit("msg", { comment: "hi" });
		},
		async screenCapture(){
			const displayStream = await navigator.mediaDevices.getDisplayMedia({audio:true,video:true});
			this.stream = displayStream;
			console.log(displayStream)
		}
	},
	created() {
		this.init();
	}
};
</script>

<style></style>
