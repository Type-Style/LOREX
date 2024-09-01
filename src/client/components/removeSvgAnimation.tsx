document.addEventListener('DOMContentLoaded', () => {
	const mq = window.matchMedia('(prefers-reduced-motion: reduce), (update: slow)');

	//  -- create small SVG to inject to see when SVG animations are rendered and started --
	const svgTemplate = `<svg class="visually-hidden" aria-hidden="true" width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="100" r="30" fill="red">
			<animate attributeName="cx" from="50" to="150" dur="1s" begin="0s" repeatCount="1" />
		</circle>
	</svg>`;

	const container = document.createElement('div');
	container.innerHTML = svgTemplate;

	const animateElement = container.querySelector('animate');
	animateElement.addEventListener('beginEvent', () => {
		if (mq.matches) {
			const animations = document.querySelectorAll('animate, animateTransform');
			animations.forEach(animationElement => {
				(animationElement as SVGAnimateElement).endElement();
			});
		}
	});


	// Append the SVG directly to the document body
	document.body.appendChild(container.firstElementChild as SVGElement);

});