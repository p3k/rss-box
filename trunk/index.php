<html>
<head>
	<title>JavaScript RSS-Box Viewer 0.9b</title>
	</head>
<body>

<?
$url = urlencode($_GET["url"]);
$width = urlencode($_GET["width"]);
$align = urlencode($_GET["align"]);
$frameColor = urlencode($_GET["frameColor"]);
$titleBarColor = urlencode($_GET["titleBarColor"]);
$titleBarTextColor = urlencode($_GET["titleBarTextColor"]);
$boxFillColor = urlencode($_GET["boxFillColor"]);
$textColor = urlencode($_GET["textColor"]);
$fontFace = urlencode($_GET["fontFace"]);
$maxItems = urlencode($_GET["maxItems"]);
$xmlButton = urlencode($_GET["xmlButton"]);
$compact = urlencode($_GET["compact"]);
virtual("rss-box.r?url=$url&setup=true&width=$width&align=$align&frameColor=$frameColor&titleBarColor=$titleBarColor&titleBarTextColor=$titleBarTextColor&boxFillColor=$boxFillColor&textColor=$textColor&fontFace=$fontFace&maxItems=$maxItems&xmlButton=$xmlButton&compact=$compact");
?>

</body>
</html>
