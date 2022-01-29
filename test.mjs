import { TOMP } from './TOMP.mjs';

const tomp = new TOMP({
	directory: '/',
	bare: '/',

});

const input = `
<!DOCTYPE HTML>
<html>
	<head>
		<link rel='stylesheet' href='./assets/beta.css' />
	</head>
	<body>
		<img src='./test' srcset='/272x92dp.png 1x, /272x92dp.png 2x'></img>
		<script src='../../../assets/beta.js'></script>
		<a href='click'>click</a>
	</body>
</html>
`;

const base = new URL('https://www.sys32.dev/');
const rewritten = tomp.html.wrap(input, base);
const unrewritten = tomp.html.unwrap(rewritten, base);

console.log(rewritten);

console.log('UNRW: ==========');

console.log(unrewritten);