function showMenu() {
            document.getElementById('mainMenu').style.display = 'flex';
            document.getElementById('playScreen').classList.remove('active');
            document.getElementById('howToPlayScreen').classList.remove('active');
        }

        function showPlay() {
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('playScreen').classList.add('active');
        }

        function showHowToPlay() {
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('howToPlayScreen').classList.add('active');
        }