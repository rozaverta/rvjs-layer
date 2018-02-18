let Production = false;

try {
	Production = process.env.NODE_ENV === 'production'
}
catch(e) {}

export default function Log(e)
{
	if( !Production ) {
		console.log("Layer error >>", e)
	}
}