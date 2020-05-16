if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(function (reg) {
                    // registration worked
                    console.log('Registration succeeded. Scope is ' + reg.scope);
                }).catch(function (error) {
                    // registration failed
                    console.log('Registration failed with ' + error);
                });
        }
        var overlay = document.getElementById('overlay');
        var closeMenu = document.getElementById('close-menu');

        document.getElementById('hamburger-menu').addEventListener('click', function () {
            overlay.classList.add('show-menu');
        });

        document.getElementById('close-menu-btn').addEventListener('click', function () {
            overlay.classList.remove('show-menu');
        });
        document.getElementById('close-menu').addEventListener('click', function () {
            overlay.classList.remove('show-menu');
        });

        var typed3 = new Typed('#typed3', {
            strings: ['<span class="reddish">de</span>sig<span class="blueish">n</span>.',
                '<span class="reddish">lo</span>ve<span>.</span>',
                '<span class="reddish">li</span>fe<span class="blueish"></span>.',
                '<span class="reddish">de</span>sig<span class="blueish">n</span>.'
            ],
            typeSpeed: 120,
            backSpeed: 100,
            smartBackspace: true, // this is a default
            loop: false
        });
        var typed4 = new Typed('#typed4', {
            strings: [
                '<span class="reddish">Ko</span><span class="blueish">z</span>',
                '<span class="reddish">Ko</span><span class="blueish">za</span>n'
            ],
            typeSpeed: 80,
            backSpeed: 90,
            smartBackspace: true, // this is a default
            loop: false

        });
        // target elements with the "draggable" class
        // target elements with the "draggable" class
        interact('.draggable')
            .draggable({
                // enable inertial throwing
                inertia: true,
                // keep the element within the area of it's parent
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                // enable autoScroll
                autoScroll: true,

                // call this function on every dragmove event
                onmove: dragMoveListener,
                // call this function on every dragend event
                onend: function (event) {
                    var textEl = event.target.querySelector('p')

                    textEl && (textEl.textContent =
                        'moved a distance of ' +
                        (Math.sqrt(Math.pow(event.pageX - event.x0, 2) +
                            Math.pow(event.pageY - event.y0, 2) | 0))
                            .toFixed(2) + 'px')
                }
            })

        function dragMoveListener(event) {
            var target = event.target
            // keep the dragged position in the data-x/data-y attributes
            var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
            var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

            // translate the element
            target.style.webkitTransform =
                target.style.transform =
                'translate(' + x + 'px, ' + y + 'px)'

            // update the posiion attributes
            target.setAttribute('data-x', x)
            target.setAttribute('data-y', y)
        }

        // this is used later in the resizing and gesture demos
        window.dragMoveListener = dragMoveListener