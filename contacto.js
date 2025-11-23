// ========================================
// CONTACTO.JS - Formulario de Contacto
// ========================================

class SistemaContacto {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.init();
    }

    init() {
        if (this.form) {
            this.setupValidation();
            this.setupFormSubmit();
        }
    }

    // Configurar validación en tiempo real
    setupValidation() {
        // Validación de email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validarEmail(emailInput);
            });
        }

        // Validación de teléfono
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.addEventListener('input', (e) => {
                // Solo números y caracteres permitidos
                e.target.value = e.target.value.replace(/[^0-9+\-() ]/g, '');
            });
        }

        // Validación de campos requeridos
        const camposRequeridos = ['nombre', 'email', 'tipoUsuario', 'asunto', 'mensaje'];
        camposRequeridos.forEach(campo => {
            const input = document.getElementById(campo);
            if (input) {
                input.addEventListener('blur', () => {
                    this.validarCampoRequerido(input);
                });
            }
        });
    }

    // Validar email
    validarEmail(input) {
        const email = input.value.trim();
        
        if (!email) {
            this.mostrarError(input, 'El email es requerido');
            return false;
        }

        if (!Utils.validarEmail(email)) {
            this.mostrarError(input, 'Email inválido');
            return false;
        }

        this.limpiarError(input);
        return true;
    }

    // Validar campo requerido
    validarCampoRequerido(input) {
        const valor = input.value.trim();
        
        if (!valor) {
            this.mostrarError(input, 'Este campo es requerido');
            return false;
        }

        this.limpiarError(input);
        return true;
    }

    // Mostrar error
    mostrarError(input, mensaje) {
        // Remover error anterior si existe
        this.limpiarError(input);

        // Agregar clase de error
        input.classList.add('is-invalid');

        // Crear mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = mensaje;
        input.parentNode.appendChild(errorDiv);
    }

    // Limpiar error
    limpiarError(input) {
        input.classList.remove('is-invalid');
        const errorDiv = input.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Validar todo el formulario
    validarFormulario() {
        let esValido = true;

        // Validar nombre
        const nombre = document.getElementById('nombre');
        if (!this.validarCampoRequerido(nombre)) {
            esValido = false;
        }

        // Validar email
        const email = document.getElementById('email');
        if (!this.validarEmail(email)) {
            esValido = false;
        }

        // Validar tipo de usuario
        const tipoUsuario = document.getElementById('tipoUsuario');
        if (!this.validarCampoRequerido(tipoUsuario)) {
            esValido = false;
        }

        // Validar asunto
        const asunto = document.getElementById('asunto');
        if (!this.validarCampoRequerido(asunto)) {
            esValido = false;
        }

        // Validar mensaje
        const mensaje = document.getElementById('mensaje');
        if (!this.validarCampoRequerido(mensaje)) {
            esValido = false;
        }

        return esValido;
    }

    // Configurar envío del formulario
    setupFormSubmit() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validar formulario
            if (!this.validarFormulario()) {
                Utils.mostrarAlerta('Por favor completa todos los campos requeridos correctamente', 'warning');
                return;
            }

            // Obtener datos del formulario
            const formData = this.getFormData();

            // Simular envío (guardar en localStorage)
            await this.enviarFormulario(formData);
        });
    }

    // Obtener datos del formulario
    getFormData() {
        return {
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            facultad: document.getElementById('facultad').value,
            tipoUsuario: document.getElementById('tipoUsuario').value,
            asunto: document.getElementById('asunto').value.trim(),
            mensaje: document.getElementById('mensaje').value.trim(),
            fecha: new Date().toISOString()
        };
    }

    // Simular envío del formulario
    async enviarFormulario(formData) {
        // Mostrar loading
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const textoOriginal = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

        try {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Guardar en localStorage (simulación)
            this.guardarMensaje(formData);

            // Limpiar formulario
            this.form.reset();

            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = textoOriginal;

            // Mostrar modal de éxito
            const modal = new bootstrap.Modal(document.getElementById('exitoModal'));
            modal.show();

            // También mostrar alerta
            Utils.mostrarAlerta('¡Mensaje enviado exitosamente!', 'success');

        } catch (error) {
            console.error('Error enviando formulario:', error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = textoOriginal;
            Utils.mostrarAlerta('Error al enviar el mensaje. Intenta nuevamente.', 'danger');
        }
    }

    // Guardar mensaje en localStorage (simulación)
    guardarMensaje(formData) {
        const mensajes = JSON.parse(localStorage.getItem('cul_mensajes') || '[]');
        mensajes.push(formData);
        localStorage.setItem('cul_mensajes', JSON.stringify(mensajes));
        
        console.log('Mensaje guardado:', formData);
        console.log('Total de mensajes:', mensajes.length);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SistemaContacto();
});