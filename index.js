(function () {
	$(document).ready(function () {
		var tweetsIterator = 0
		$("#tweetBtn")
			.on("click", function () {
				var text = $("#tweetText").val()
				getTweets(text, function (error, data) {
					tweetSource.clear()
					data.statuses.forEach(function (value, index, array) {
						addTweetsInMap(value)
					})
				})
			})
	})


	var osmLayer = new ol.layer.Tile({
		source: new ol.source.OSM()
	})

	var view = new ol.View({
		center: [0, 0],
		zoom: 1
	})

	var tweetSource = new ol.source.Vector({})

	var tweetCluster = new ol.source.Cluster({
		distance: 20,
		source: tweetSource
	})

	var heatMapLayer = new ol.layer.Heatmap({
		source: tweetSource
	})


	var select = new ol.interaction.Select({
		style: new ol.style.Style({

		})
	})
	var selectedFeatures = select.getFeatures()

	var dragBox = new ol.interaction.DragBox({
		condition: ol.events.condition.platformModifierKeyOnly
	})


	dragBox.on("boxstart", function (e) {
		console.log("box started")
	})

	var tweetLayer = new ol.layer.Vector({
		source: tweetCluster,
		style: function (feature, resolution) {
			var size = feature.get("features").length
			var circle = new ol.style.Circle({
				radius: size,
				fill: new ol.style.Fill({
					color: [32, 43, 124, 1]
				}),
				stroke: new ol.style.Stroke({
					color: [32, 43, 124, 1]
				})
			})

			var style = new ol.style.Style({
				image: circle
			})

			return style
		}
	})



	var map = new ol.Map({
		view: view,
		target: "map",
		layers: [osmLayer, tweetLayer],
		controls: ol.control.defaults({
			Slider: true,
			ScaleLine: true
		})
	})

	map.addInteraction(select)
	map.addInteraction(dragBox)

	dragBox.on("boxend", function (event) {
		var statusesBody = $("#statusesBody")
		statusesBody.empty()
		var extent = dragBox.getGeometry().getExtent()
		tweetSource.forEachFeatureIntersectingExtent(extent, function (feature) {
			statusesBody.append(
				$("<tr></tr>")
					.append("<td>"+feature.get("text")+"</td>")
					.append("<td>"+feature.get("screen_name")+"</td>")
			)
		})
	})

	map.on("click", function (event) {
		console.log(eve)
	})

	$("#switchHeatBtn").on("click", function (event) {
		map.removeLayer(tweetLayer)
		map.addLayer(heatMapLayer)
		$("#switchHeatBtn").remove()
	})

	map.on("click", function (browserEvent) {
		var coords = browserEvent.coordinate
		// console.log(browserEvent)
		var pixel = map.getPixelFromCoordinate(coords)

		map.forEachFeatureAtPixel(pixel, function (feature, resolution) {
		})
	})

	
	$("#nextTweetBtn").on("click", function (event) {
		var features = tweetSource.getFeatures()
		var feature = features[tweetsIterator]

		var coordinate = feature.get("coords")

		panToCoordinates(feature.getGeometry().flatCoordinates)
		tweetsIterator++
	})

	$("#previousTweetBtn").on("click", function (event) {
		if (tweetsIterator < 0) {
			alert("No previous tweets to show")
		}
		else {
			tweetsIterator--
			var features = tweetSource.getFeatures()

			panToCoordinates(features[tweetsIterator].getGeometry().flatCoordinates)
		}



	})

	function panToCoordinates(location) {
		
		var panAnimation = ol.animation.pan({
			duration: 2000,
			source: view.getCenter()
		})

		map.beforeRender(panAnimation)
		view.setCenter(location)
	}

	$("#animationBtn").on("click", function (event) {
		var okaraLocation = ol.proj.transform([30, 20], "EPSG:4326", "EPSG:3857")
	})

	function displayTweet() {

	}


	function addTweetsInMap(tweet) {
		tweetsIterator = 0
		if (tweet.location_point) {
			var transformation = ol.proj.transform(tweet.location_point, "EPSG:4326", "EPSG:3857")
			var newTweetPoint = new ol.geom.Point(transformation)
			var tweetFeature = new ol.Feature({
				geometry: newTweetPoint,
				text: tweet.text,
				screen_name: tweet.screen_name,
				coords: tweet.location_point
			})

			tweetSource.addFeature(tweetFeature)
		}
	}
})()

function getTweets(query, cb) {
	var loklakSearchUrl = "http://loklak.org/api/search.json"
	$.ajax({
		url: loklakSearchUrl,
		data: {
			q: query
		},
		dataType: "jsonp",
		callback: "JSON_CALLBACK"
	})
	.then(function (data) {
		cb(null, data)
	})	
	.fail(function (error) {
		cb(error)
	})
}