import * as ck from 'ckeditor5';
console.log(['Image','ImageBlock','ImageInline','ImageInsert','ImageToolbar','ImageCaption','ImageResize','ImageUpload','AutoImage'].map(k=>`${k}:${Boolean(ck[k])}`).join('\n'));
