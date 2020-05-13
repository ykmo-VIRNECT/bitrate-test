<template>
	<div>
		<h1>SampleVideo 720p(1280x720) {{status}}</h1>
		<div>
			<button @click="startRecord">start record</button>
			<button @click="timerRecord">start record(10s)</button>
			<button @click="startRecord(true)">start timeSliceMode(3s)</button>
			<button @click="stopRecord">stop record</button>
			<button @click="sendMessage">sendMessage</button>
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
import io from 'socket.io-client';
 

export default {
	data() {
		return {
			stream: null,
			recorder: null,
			selected: "",
			status: "Idle",
			blobArray: [],
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
			socket:null
		};
	},
	components: {},
	methods: {
		async init() {
			const constraints = {
				audio: true,
				video: { width: 1280, height: 720 }
			};
			this.socket = io('http://localhost:8080');
			this.socket.on('recMsg', function (data) {
				console.log(data.comment)
			});
			try {
				this.stream = await navigator.mediaDevices.getUserMedia(constraints);
			} catch (err) {
				console.log(err);
			}
		},
		startRecord(timeSliceMode) {
			this.status = "Recording";
			let option = {
				type: "video",
				bitsPerSecond: this.selected,
				mimeType: "video/webm"
			};

			if (timeSliceMode) {
				option.timeSlice = 3000;
				option.onTimeStamp = timestamp => {
					console.log(timestamp);
				};

				option.ondataavailable = function(blob) {
					RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.selected);
				};
			}
			this.recorder = new RecordRTC.RecordRTCPromisesHandler(
				this.stream,
				option
			);
			this.recorder.startRecording();
		},
		async stopRecord() {
			this.status = "Stopped";
			await this.recorder.stopRecording();
			let blob = await this.recorder.getBlob();

			RecordRTC.invokeSaveAsDialog(blob, "test : bitrate" + this.selected);

			this.status = "idle";
		},
		async timerRecord() {
			this.startRecord();
			const sleep = m => new Promise(r => setTimeout(r, m));
			await sleep(10000);
			this.stopRecord();
		},
		sendMessage(){
			this.socket.emit("msg", {comment: 'hi'});
		}
		
	},
	created() {
		this.init();
	}
};
</script>

<style></style>
