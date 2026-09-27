const link = document.createElement("a");
link.href = "rooster-vc.txt";
link.download = "rooster-vc.txt";
document.body.appendChild(link);
link.click();
link.remove();
