// ========================================
// RESULTADOS.JS - Sistema de Resultados
// ========================================

class SistemaResultados {
    constructor() {
        this.candidatos = [];
        this.votosManager = new VotosManager();
        this.programaActual = 'representante_estudiantil';
        this.charts = {
            barras: null,
            torta: null
        };
        
        this.init();
    }

    async init() {
        await this.cargarDatos();
        this.setupEventListeners();
        this.actualizarResultados();
        this.iniciarActualizacionAutomatica();
    }

    // Cargar datos
    async cargarDatos() {
        try {
            const response = await fetch('candidatos.json');
            const data = await response.json();
            this.candidatos = data.candidatos;
            this.programasData = data.programas;
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    // Actualizar todos los resultados
    actualizarResultados() {
        this.actualizarHora();
        this.actualizarEstadisticasGenerales();
        this.actualizarPodio();
        this.actualizarTabla();
        this.actualizarGraficos();
        this.actualizarEstadisticasFacultad();
    }

    // Actualizar hora de última actualización
    actualizarHora() {
        const ahora = new Date();
        const hora = ahora.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('ultimaActualizacion').textContent = hora;
    }

    // Actualizar estadísticas generales
    actualizarEstadisticasGenerales() {
        const votos = this.votosManager.getVotos();
        const totalVotos = Object.values(votos).reduce((sum, v) => sum + v, 0);
        
        // Obtener electores estimados del programa actual
        const electoresEstimados = this.programasData[this.programaActual]?.electoresEstimados || 3500;
        const participacion = ((totalVotos / electoresEstimados) * 100).toFixed(1);

        document.getElementById('totalVotosEmitidos').textContent = totalVotos;
        document.getElementById('totalVotantes').textContent = totalVotos;
        document.getElementById('porcentajeParticipacion').textContent = `${participacion}%`;
    }

    // Obtener resultados del programa actual
    getResultadosPrograma() {
        const candidatosPrograma = this.candidatos.filter(c => c.programa === this.programaActual);
        const votos = this.votosManager.getVotos();
        
        // Calcular votos y porcentajes
        const totalVotosPrograma = candidatosPrograma.reduce((sum, c) => {
            return sum + (votos[c.id] || c.votosIniciales);
        }, 0);

        const resultados = candidatosPrograma.map(candidato => {
            const votosTotal = votos[candidato.id] || candidato.votosIniciales;
            const porcentaje = totalVotosPrograma > 0 
                ? ((votosTotal / totalVotosPrograma) * 100).toFixed(2)
                : 0;
            
            return {
                ...candidato,
                votos: votosTotal,
                porcentaje: parseFloat(porcentaje)
            };
        });

        // Ordenar por votos (descendente)
        return resultados.sort((a, b) => b.votos - a.votos);
    }

    // Actualizar podio (Top 3)
    actualizarPodio() {
        const resultados = this.getResultadosPrograma();
        const top3 = resultados.slice(0, 3);
        const container = document.getElementById('podioContainer');

        if (top3.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No hay resultados disponibles</div>';
            return;
        }

        const medallas = ['🥇', '🥈', '🥉'];
        const clases = ['podium-1', 'podium-2', 'podium-3'];
        const colores = ['#FFD700', '#C0C0C0', '#CD7F32'];

        container.innerHTML = top3.map((candidato, index) => `
            <div class="col-md-4">
                <div class="podium-card ${clases[index]}">
                    <div class="display-1 mb-3">${medallas[index]}</div>
                    <img src="${candidato.foto}" alt="${candidato.nombreCompleto}" 
                         class="rounded-circle mb-3" style="width: 120px; height: 120px; object-fit: cover;">
                    <h4 class="fw-bold">${candidato.nombreCompleto}</h4>
                    <p class="text-muted">${candidato.facultad}</p>
                    <div class="mt-3">
                        <h2 class="fw-bold" style="color: ${colores[index]}">${candidato.votos}</h2>
                        <p class="text-muted">votos (${candidato.porcentaje}%)</p>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar" style="width: ${candidato.porcentaje}%; background-color: ${colores[index]}"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Actualizar tabla de resultados
    actualizarTabla() {
        const resultados = this.getResultadosPrograma();
        const tbody = document.getElementById('tablaResultados');

        if (resultados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-5">No hay resultados disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = resultados.map((candidato, index) => `
            <tr>
                <td class="fw-bold">${index + 1}</td>
                <td>
                    <img src="${candidato.foto}" alt="${candidato.nombreCompleto}" 
                         class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>
                    <strong>${candidato.nombreCompleto}</strong>
                    <br>
                    <small class="text-muted">${candidato.slogan}</small>
                </td>
                <td>${candidato.facultad}</td>
                <td class="fw-bold text-primary">${candidato.votos}</td>
                <td class="fw-bold">${candidato.porcentaje}%</td>
                <td>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar progress-bar-custom" 
                             style="width: ${candidato.porcentaje}%"
                             role="progressbar">
                            ${candidato.porcentaje}%
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Actualizar gráficos (Chart.js)
    actualizarGraficos() {
        const resultados = this.getResultadosPrograma();
        
        if (resultados.length === 0) return;

        const labels = resultados.map(c => c.nombreCompleto);
        const data = resultados.map(c => c.votos);
        const backgroundColors = [
            '#1B4F72', '#F39C12', '#2C3E50', '#27AE60', '#E74C3C',
            '#8E44AD', '#3498DB', '#F1C40F', '#16A085'
        ];

        // Gráfico de Barras
        this.actualizarGraficoBarras(labels, data, backgroundColors);

        // Gráfico de Torta
        this.actualizarGraficoTorta(labels, data, backgroundColors);
    }

    // Gráfico de Barras
    actualizarGraficoBarras(labels, data, colors) {
        const ctx = document.getElementById('barrasChart');
        if (!ctx) return;

        // Destruir gráfico anterior si existe
        if (this.charts.barras) {
            this.charts.barras.destroy();
        }

        this.charts.barras = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votos',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Votos por Candidato'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Torta
    actualizarGraficoTorta(labels, data, colors) {
        const ctx = document.getElementById('tortaChart');
        if (!ctx) return;

        // Destruir gráfico anterior si existe
        if (this.charts.torta) {
            this.charts.torta.destroy();
        }

        this.charts.torta = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Porcentaje de Votos'
                    }
                }
            }
        });
    }

    // Actualizar estadísticas por facultad
    actualizarEstadisticasFacultad() {
        const resultados = this.getResultadosPrograma();
        const container = document.getElementById('estadisticasFacultad');

        if (resultados.length === 0) return;

        // Agrupar por facultad
        const porFacultad = {};
        resultados.forEach(candidato => {
            if (!porFacultad[candidato.facultad]) {
                porFacultad[candidato.facultad] = {
                    facultad: candidato.facultad,
                    candidatos: 0,
                    votosTotal: 0
                };
            }
            porFacultad[candidato.facultad].candidatos++;
            porFacultad[candidato.facultad].votosTotal += candidato.votos;
        });

        container.innerHTML = Object.values(porFacultad).map(data => `
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-university text-primary me-2"></i>
                            ${data.facultad}
                        </h5>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <span>Candidatos:</span>
                            <strong class="text-primary">${data.candidatos}</strong>
                        </div>
                        <div class="d-flex justify-content-between mt-2">
                            <span>Votos Totales:</span>
                            <strong class="text-success">${data.votosTotal}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Iniciar actualización automática cada 5 segundos
    iniciarActualizacionAutomatica() {
        setInterval(() => {
            this.actualizarResultados();
        }, 5000);
    }

    // Event listeners
    setupEventListeners() {
        // Selector de programa
        const programaSelect = document.getElementById('programaSelectResultados');
        if (programaSelect) {
            programaSelect.addEventListener('change', (e) => {
                this.programaActual = e.target.value;
                this.actualizarResultados();
            });
        }

        // Botón actualizar
        const actualizarBtn = document.getElementById('actualizarBtn');
        if (actualizarBtn) {
            actualizarBtn.addEventListener('click', () => {
                // Animación de rotación
                const icon = actualizarBtn.querySelector('i');
                icon.style.animation = 'spin 1s linear';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 1000);
                
                this.actualizarResultados();
                Utils.mostrarAlerta('Resultados actualizados', 'success');
            });
        }
    }
}

// Animación de rotación para el botón actualizar
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SistemaResultados();
});