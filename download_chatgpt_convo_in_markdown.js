// ==UserScript==
// @name         Download ChatGPT Convo in Markdown
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Adds a download chat button to download the current chatGPT conversation in markdown format. Original MD processing code by: u/Creative_Original918 from Reddit. Code from the following thread: https://www.reddit.com/user/Creative_Original918/ https://www.reddit.com/r/ChatGPT/comments/zm237o/comment/jdjwyyo/?utm_source=share&utm_medium=web2x&context=3
// @author       https://github.com/node0 and https://www.reddit.com/user/Creative_Original918/
// @match        https://chat.openai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
function setupStylesheet(){
var css = `
		button#chatGPTConvoDownloadBtn {
			color: #d9d9e3;
			background-color: rgb(52,53,65);
			font-size: 0.875rem;
			padding: 8px 12px;
			border: 1px solid;
			border-radius: 3px;
			border-color: rgba(86, 88, 105, 1);
		}

		button#chatGPTConvoDownloadBtn:hover {
			background-color: rgb(64,65,79);
		}`;
var head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));

    head.appendChild(style);
}
setupStylesheet();

function SaveChatGPTtoMD() {
	const chatMessages = document.querySelectorAll(".text-base");
	const pageTitle = document.title;
	const now = new Date();
    const dateString = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    /*const dateStringWithSs = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;*/

let fileName = `ChatGPT_log_${pageTitle}_${dateString}.md`.replace( /\s/g, "_" ).replace( /(\.-|\._)/, "_" );
	let markdownContent = "";
	for (const message of chatMessages) {
		let Revision = ''; const revisionElement = message.querySelector(".text-xs .flex-grow"); // Revision Count: .text-xs means it has revision and .flex-grow is where the text is stored
		if (revisionElement && revisionElement.innerHTML) { Revision = `Edit Revision: **${revisionElement.innerHTML}**\n`; }
		if (message.querySelector(".whitespace-pre-wrap")) {
			let messageText = message.querySelector(".whitespace-pre-wrap").innerHTML;
			const sender = message.querySelector("img") ? "You" : "ChatGPT";
			// adds Escapes to non-MD
			messageText = messageText.replace(/_/gs, "\_").replace(/\*/gs, "\*").replace(/\^/gs, "\^").replace(/~/gs, "\~"); // I debated adding #, > (blockquotes), and | (table)
			// <p> element and everything in-line or inside
			messageText = messageText.replace(/<p>(.*?)<\/p>/g, function(match, p1) { return '\n' + p1.replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<\/?b>/g, "**").replace(/<\/?i>/g, "_").replace(/<code>/g, " `").replace(/<\/code>/g, "` ") + '\n'; });
			markdownContent += `**${sender}:** ${Revision}${messageText.trim()}\n\n`;
	}	}
	// Remove Span with only class declaration, there is nesting? If there is more than 5 layers, just do it manually
	const repeatSpan = /<span class="[^"]*">([^<]*?)<\/span>/gs; markdownContent = markdownContent.replace(repeatSpan, "$1").replace(repeatSpan, "$1").replace(repeatSpan, "$1").replace(repeatSpan, "$1").replace(repeatSpan, "$1");
	// Code Blocks, `text` is the default catch-all (because some commands/code-blocks aren't styled/identified by ChatGPT yet)
	markdownContent = markdownContent.replace(/<pre>.*?<code[^>]*>(.*?)<\/code>.*?<\/pre>/gs, function(match, p1) { const language = match.match(/class="[^"]*language-([^"\s]*)[^"]*"/); const languageIs = language ? language[1] : 'text'; return '\n``` ' + languageIs + '\n' + p1 + '```\n'; });
	//it looks redundent, but trust me lol...
	markdownContent = markdownContent.replace(/<p>(.*?)<\/p>/g, function(match, p1) { return '\n' + p1.replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<\/?b>/g, "**").replace(/<\/?i>/g, "_").replace(/<code>/g, " `").replace(/<\/code>/g, "` ") + '\n'; });
	markdownContent = markdownContent.replace(/<div class="markdown prose w-full break-words dark:prose-invert dark">/gs, "").replace(/\r?\n?<\/div>\r?\n?/gs, "\n").replace(/\*\*ChatGPT:\*\* <(ol|ul)/gs, "**ChatGPT:**\n<$1").replace(/&gt;/gs, ">").replace(/&lt;/gs, "<").replace(/&amp;/gs, "&");
	const downloadLink = document.createElement("a");
	downloadLink.download = fileName;
	downloadLink.href = URL.createObjectURL(new Blob([markdownContent], { type: "text/markdown" }));
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);
	downloadLink.click();
}


function createDownloadButton(){
	var regenButtonCont;
	document.querySelectorAll(`div > button > div`).forEach( div =>
	{
    regenButtonCont = div.textContent.includes("Regenerate") ? div.parentNode.parentNode : false;
	})

	if ( regenButtonCont != false )
	{
		var downloadButton = document.createElement("button");
		downloadButton.id = 'chatGPTConvoDownloadBtn';
		downloadButton.textContent = "Download Chat";

		if ( document.getElementById( downloadButton.id ) == null )
		{
			regenButtonCont.appendChild(downloadButton);
			let downloadBtn = document.getElementById( downloadButton.id );
			downloadBtn.addEventListener("click", SaveChatGPTtoMD );
		}
	}

}
const makeDownloadButtonClickable = setInterval(createDownloadButton, 3000);
})();
