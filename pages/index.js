import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Footer from '../components/Footer'
import Swal from 'sweetalert2'
import erf from 'math-erf'

const index = () => {

    const [numConexiones, setNumConexiones] = useState([]);
    const [watts, setWatts] = useState(1e-3);
    const [dBmEntrada, setDBmEntrada] = useState(0);
    const [active, setActive] = useState(true);
    const [avtiveFinal, setAvtiveFinal] = useState(false)
    const [gap, setGap] = useState(false);
    const [parametros, setParametros] = useState({
        n: 1,
        n1: 1.5,
        n2: 1.45,
        diametro: 50e-6,
        longitud: 820e-9,
        Bw: 2e6,
        e: 1.602e-19,
        h: 6.626e-34,
        c: 3e8,
        k: 1.38e-23,
        T: 300,
        eficiencia: 0.5,
        V: 20,
        R: 100,
        Id: 2e-9
    });
    const [salida, setSalida] = useState(0);
    const [responsividad, setResponsividad] = useState(0)
    const [corriente, setCorriente] = useState(0);
    const [MAX, setMAX] = useState(false);
    const [Pmaxima, setPmaxima] = useState(0);
    const [PId, setPId] = useState(0);
    const [Ptermico, setPtermico] = useState(0);
    const [Pshot, setPshot] = useState(0);
    const [relacion, setRelacion] = useState(0);
    const [esrrorBit, setEsrrorBit] = useState(0);
    const [fotnesIncidentes, setfotnesIncidentes] = useState(0);
    const [fotonesBit, setFotonesBit] = useState(0);
    const [potenciarecibida, setPotenciarecibida] = useState(0)

    const onChangeConexiones = (e) => {

        let vector = []
        let size = parseInt(e.target.value) + 1

        for (let i = 0; i < size; i++) {
            if (i === 0) {
                vector[i] = {
                    num: i,
                    value: dBmEntrada,
                    perdida: 0,
                    Longitudinal: 0,
                    lateral: 0,
                    angular: 0
                };
            } else {
                vector[i] = {
                    num: i,
                    value: 0,
                    perdida: 0,
                    Longitudinal: 0,
                    lateral: 0,
                    angular: 0
                };
            }
        }

        setNumConexiones(vector)
        console.log(vector)
    }

    useEffect(() => {

        let watts2dBm = 0
        watts2dBm = 10 * Math.log10(watts / 1e-3)
        setDBmEntrada(watts2dBm)

    }, [watts, corriente])

    const onChangePerdidas = (e, pos) => {

        let vector = []
        for (let i = 0; i < numConexiones.length; i++) {
            vector[i] = numConexiones[i];
        }
        vector[pos] = Object.assign({}, vector[pos], { [e.target.name]: parseFloat(e.target.value) })
        setNumConexiones(vector)
        console.log(pos)

    }

    const onChangeParametros = (e) => {

        setParametros(Object.assign({}, parametros, { [e.target.name]: parseFloat(e.target.value) }))
    }

    const handleGap = (e) => {
        setGap(!gap)
        console.log(e.target.value)
    }

    const onChangeWatts = (e) => {
        setWatts(e.target.value)
        console.log(e.target.value)
    }

    const activarTodo = (e) => {
        e.preventDefault()


        let vector = []

        for (let i = 0; i < numConexiones.length; i++) {
            vector[i] = numConexiones[i];
        }




        let NA = Math.sqrt(Math.pow(parametros.n1, 2) - Math.pow(parametros.n2, 2))

        //gap
        let r = Math.pow((parametros.n1 - parametros.n) / (parametros.n1 + parametros.n), 2)
        let LossFres = -10 * Math.log10(1 - r) * 2;

        let radio = parametros.diametro / 2



        for (let i = 0; i < numConexiones.length; i++) {

            let dB1 = 0
            let dB2 = 0
            let dB3 = 0

            //lateral
            let Nlat1 = (1 / Math.PI) * (2 * Math.acos(numConexiones[i].lateral / parametros.diametro) - (numConexiones[i].lateral / radio) * Math.sqrt(1 - Math.pow(numConexiones[i].lateral / parametros.diametro, 2)));
            dB1 = -10 * Math.log10(Nlat1);

            //angular
            let Nlat2 = 1 - (((parametros.n * numConexiones[i].angular * Math.PI / 180) / (Math.PI * NA)));
            dB2 = -10 * Math.log10(Nlat2);

            //longitudinal
            let Nlat3 = 1 - ((numConexiones[i].Longitudinal * NA) / (4 * radio * parametros.n));
            dB3 = -10 * Math.log10(Nlat3);

            if (gap) {

                vector[i] = Object.assign({}, vector[i], { perdida: dB1 + dB2 + dB3 + LossFres })

            } else {

                vector[i] = Object.assign({}, vector[i], { perdida: dB1 + dB2 + dB3 })

            }

            setNumConexiones(vector)
        }

        for (let i = 1; i < numConexiones.length; i++) {
            vector[i] = Object.assign({}, vector[i], { value: vector[i - 1].value - vector[i - 1].perdida })
            setNumConexiones(vector)
        }

        let watts = Math.pow(10, (numConexiones[numConexiones.length - 1].value) / 10) * 1e-3
        setSalida(watts)
        console.log(watts)

        let respon = (parametros.eficiencia * parametros.e * parametros.longitud) / (parametros.h * parametros.c)
        let corr = salida * respon;
        let Pmax = parametros.V / (respon * parametros.R)
        console.log(Pmax, salida)
        setPmaxima(Pmax)
        let poteciaMaxima = false
        let Ioscura = 2 * parametros.e * parametros.Bw * parametros.Id
        let PcorrienteOscura = parametros.R * Ioscura;
        let PruidoTermico = 4 * parametros.k * parametros.T * parametros.Bw
        let PruidoShot = 2 * parametros.e * parametros.Bw * (corr + parametros.Id) * parametros.R
        let Pes = parametros.R * Math.pow(corr, 2)
        let RelacionSeñalRuido = (parametros.R * Math.pow(corr, 2)) / (PruidoTermico + PruidoShot)
        let Error = 0.5 - 0.5 * erf(0.354 * Math.sqrt(RelacionSeñalRuido))
        let fotones = (salida * parametros.longitud) / (parametros.h * parametros.c)
        let fotonesPorBit = fotones / parametros.Bw
        if (Pmax > salida) {
            setAvtiveFinal(true)
            setResponsividad(respon)
            setCorriente(corr)
            setPId(PcorrienteOscura)
            setPtermico(PruidoTermico)
            setPshot(PruidoShot)
            setRelacion(RelacionSeñalRuido)
            setEsrrorBit(Error)
            setfotnesIncidentes(fotones)
            setFotonesBit(fotonesPorBit)
            setPotenciarecibida(Pes)
            poteciaMaxima = false
        } else {
            Swal.fire({
                position: 'center',
                icon: 'warning',
                title: 'Oops...',
                text: 'La potencia Optica ha sobrepasado la potencia maxima',
                showConfirmButton: false,
                timer: 4000
            })
            poteciaMaxima = true
        }
        setMAX(poteciaMaxima)

    }


    return (
        <div className="container">

            <Head>
                <title>Laboratorio 2</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <h1>LABORATORIO FINAL<br />COMUNICACIONES OPTICAS <br />FIBRAS MULTIMODO</h1>

            <div className="content">

                <main>
                    <h1>Parametros</h1>
                    <label>
                        Ingrese los Watts de entrada: <br /> <br />
                        <input value={watts} type="number" onChange={onChangeWatts} />
                    </label>
                    <label>
                        Ingrese el número de conexiones de la fibra: <br /><br />
                        <select onChange={onChangeConexiones}>
                            <option value={0}>-</option>
                            <option value={1}>Una conexion</option>
                            <option value={2}>Dos conexiones</option>
                            <option value={3}>Tres conexiones</option>
                            <option value={4}>Cuatro conexiones</option>
                        </select>
                    </label>
                    <div className="params">
                        <label>
                            n
                            <input value={parametros.n} type="number" onChange={onChangeParametros} name="n" />
                        </label>
                        <label>
                            n1
                            <input value={parametros.n1} type="number" onChange={onChangeParametros} name="n1" />
                        </label>
                        <label>
                            n2
                            <input value={parametros.n2} type="number" onChange={onChangeParametros} name="n2" />
                        </label>
                        <label>
                            Diametro de Nucleo
                            <input value={parametros.diametro} type="number" onChange={onChangeParametros} name="diametro" />
                        </label>
                        <label>
                            Longitud de Onda
                            <input value={parametros.longitud} type="number" onChange={onChangeParametros} name="diametro" />
                        </label>
                        <label>
                            Ancho de Banda
                            <input value={parametros.Bw} type="number" onChange={onChangeParametros} name="Bw" />
                        </label>
                        <label>
                            Eficiencia cuantica
                            <input value={parametros.eficiencia} type="number" onChange={onChangeParametros} name="eficiencia" />
                        </label>
                        <label>
                            Voltaje de la Fuente
                            <input value={parametros.V} type="number" onChange={onChangeParametros} name="V" />
                        </label>
                        <label>
                            Resistencia
                            <input value={parametros.R} type="number" onChange={onChangeParametros} name="R" />
                        </label>
                        <label>
                            Corriente Oscura
                            <input value={parametros.Id} type="number" onChange={onChangeParametros} name="Id" />
                        </label>
                    </div>


                </main>

                {
                    active
                        ?
                        <main>
                            <label> Gap
                            <input type="checkbox" onClick={handleGap} value={!gap} />
                            </label>
                            <h1>Perdia por desalineación</h1>
                            <div className="params">
                                {
                                    numConexiones.map(conex => (
                                        (conex.num !== numConexiones.length - 1)
                                            ?
                                            <div className="param">
                                                <h3>Conexion {conex.num + 1}</h3>
                                                <label>
                                                    Longitudinal
                                                <input type="number" name="Longitudinal" onChange={(e) => { onChangePerdidas(e, conex.num) }} />
                                                </label>
                                                <label>
                                                    Angular
                                                <input type="number" name="angular" onChange={(e) => { onChangePerdidas(e, conex.num) }} />
                                                </label>
                                                <label>
                                                    Lateral
                                                <input type="number" name="lateral" onChange={(e) => { onChangePerdidas(e, conex.num) }} />
                                                </label>

                                            </div>
                                            :
                                            ''
                                    ))

                                }
                                <button style={{ gridColumn: '1/3' }} onClick={activarTodo}>Calcular</button>
                            </div>
                        </main>
                        :
                        ''
                }

                {
                    active
                        ?
                        <main style={{ gridColumn: '1/3' }}>

                            <br />

                            <div className="fibra">

                                <svg viewBox="0 0 352 512" className="bombillo">
                                    <path fill="currentColor" d="M96.06 454.35c.01 6.29 1.87 12.45 5.36 17.69l17.09 25.69a31.99 31.99 0 0 0 26.64 14.28h61.71a31.99 31.99 0 0 0 26.64-14.28l17.09-25.69a31.989 31.989 0 0 0 5.36-17.69l.04-38.35H96.01l.05 38.35zM0 176c0 44.37 16.45 84.85 43.56 115.78 16.52 18.85 42.36 58.23 52.21 91.45.04.26.07.52.11.78h160.24c.04-.26.07-.51.11-.78 9.85-33.22 35.69-72.6 52.21-91.45C335.55 260.85 352 220.37 352 176 352 78.61 272.91-.3 175.45 0 73.44.31 0 82.97 0 176zm176-80c-44.11 0-80 35.89-80 80 0 8.84-7.16 16-16 16s-16-7.16-16-16c0-61.76 50.24-112 112-112 8.84 0 16 7.16 16 16s-7.16 16-16 16z" />
                                </svg>

                                {
                                    numConexiones.map(conex => (
                                        <>
                                            <div className="seccion" key={conex.num}>
                                                <div className="centro"></div>
                                                <p className="valor">{conex.value.toFixed(2)}dBm</p>
                                            </div>
                                            {
                                                (conex.num !== numConexiones.length - 1)
                                                    ?
                                                    <div className="luz" key={-conex.num - 1}>
                                                        <p className="perdida">-{conex.perdida.toFixed(2)}dB</p>
                                                    </div>
                                                    :
                                                    ''
                                            }
                                        </>
                                    ))
                                }

                                <svg className="antena" viewBox="0 0 640 512">
                                    <path fill="currentColor" d="M150.94 192h33.73c11.01 0 18.61-10.83 14.86-21.18-4.93-13.58-7.55-27.98-7.55-42.82s2.62-29.24 7.55-42.82C203.29 74.83 195.68 64 184.67 64h-33.73c-7.01 0-13.46 4.49-15.41 11.23C130.64 92.21 128 109.88 128 128c0 18.12 2.64 35.79 7.54 52.76 1.94 6.74 8.39 11.24 15.4 11.24zM89.92 23.34C95.56 12.72 87.97 0 75.96 0H40.63c-6.27 0-12.14 3.59-14.74 9.31C9.4 45.54 0 85.65 0 128c0 24.75 3.12 68.33 26.69 118.86 2.62 5.63 8.42 9.14 14.61 9.14h34.84c12.02 0 19.61-12.74 13.95-23.37-49.78-93.32-16.71-178.15-.17-209.29zM614.06 9.29C611.46 3.58 605.6 0 599.33 0h-35.42c-11.98 0-19.66 12.66-14.02 23.25 18.27 34.29 48.42 119.42.28 209.23-5.72 10.68 1.8 23.52 13.91 23.52h35.23c6.27 0 12.13-3.58 14.73-9.29C630.57 210.48 640 170.36 640 128s-9.42-82.48-25.94-118.71zM489.06 64h-33.73c-11.01 0-18.61 10.83-14.86 21.18 4.93 13.58 7.55 27.98 7.55 42.82s-2.62 29.24-7.55 42.82c-3.76 10.35 3.85 21.18 14.86 21.18h33.73c7.02 0 13.46-4.49 15.41-11.24 4.9-16.97 7.53-34.64 7.53-52.76 0-18.12-2.64-35.79-7.54-52.76-1.94-6.75-8.39-11.24-15.4-11.24zm-116.3 100.12c7.05-10.29 11.2-22.71 11.2-36.12 0-35.35-28.63-64-63.96-64-35.32 0-63.96 28.65-63.96 64 0 13.41 4.15 25.83 11.2 36.12l-130.5 313.41c-3.4 8.15.46 17.52 8.61 20.92l29.51 12.31c8.15 3.4 17.52-.46 20.91-8.61L244.96 384h150.07l49.2 118.15c3.4 8.16 12.76 12.01 20.91 8.61l29.51-12.31c8.15-3.4 12-12.77 8.61-20.92l-130.5-313.41zM271.62 320L320 203.81 368.38 320h-96.76z" />
                                </svg>
                                <p style={{ textAlign: 'right' }}>{salida.toExponential()} watts</p>

                            </div>

                        </main>
                        :
                        ''
                }

                {
                    avtiveFinal && !MAX
                        ?
                        <main style={{ gridColumn: '1/3' }}>
                            <p>Potencia Optica Maxima: {Pmaxima.toExponential()} Watts</p>
                            <p>Responsividad: {responsividad.toExponential()} A/W</p>
                            <p>Corriente: {corriente.toExponential()} A</p>
                            <br />
                            
                            <p style={{ fontWeight: '900' }}>Potencia electrica detectada</p>
                            <p>{potenciarecibida.toExponential()}</p>
                            <p style={{ fontWeight: '900' }}>Ruidos</p>
                            <p>Potencia del ruido por la Corriente Oscura: {PId.toExponential()} W</p>
                            <p>Potencia del ruido por Ruido Termico: {Ptermico.toExponential()} W</p>
                            <p>Potencia del ruido por Ruido Shot: {Pshot.toExponential()} W</p>
                            <p style={{ fontWeight: '900' }}>Relación Señal a Ruido</p>
                            <p>{relacion.toExponential()}</p>
                            <br />
                            <p style={{ fontWeight: '900' }}>Tasa de Error de Bit</p>
                            <p>{esrrorBit}</p>
                            <br />
                            <p>Fotones incidentes por segundo</p>
                            <p>{fotnesIncidentes.toExponential()} s</p>
                            <p>Fotones incidentes por Bit</p>
                            <p>{fotonesBit.toExponential()} s</p>
                        </main>
                        :
                        ''

                }

                {
                    MAX
                        ?
                        <main style={{ gridColumn: '1/3' }}>
                            <p>Potencia Optica Maxima: {Pmaxima}</p>
                        </main>
                        :
                        ''

                }


            </div>


            <Footer />

            <style jsx>{`

                .fibra {
                }

                .params {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }

                .valor, .perdida {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .perdida {
                    top: -60px;
                }

                .param {
                    margin: 10px;
                }

                .bombillo {
                    display: inline-block;
                    width: 30px;
                    margin: 0 20px;
                    color: #FFFF00;
                    transform: rotate(90deg);
                }

                .antena {
                    display: inline-block;
                    margin: 0 10px;
                    width: 60px;
                    color: #111;
                }

                .luz {
                    z-index: -1;
                    display: inline-block;
                    width: 3px;
                    height: 50px;
                    background: #FFFF00cc;
                    box-shadow: 0 0 10px 5px #FFFF00;
                    position: relative;
                }

                .seccion {
                    z-index: 10;
                    display: inline-block;
                    width: 200px;
                    height: 50px;
                    background: #333;
                    position: relative;
                }

                .centro {
                    position: relative;
                    top: 50%;
                    transform: translateY(-50%);
                    height: 60%;
                    width: 100%;
                    background: #FFFF00;
                }

                h1 {
                    color: white;
                    text-align: center;
                }

                .content {
                    display: grid; 
                    grid-template-columns: ${active ? '1fr 1fr' : '1fr'};
                }

                .container {
                    min-height: 100vh;
                    padding: 0 0.5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                label {
                    display: grid;
                    justify-items: center;
                    color: white;
                }

                span {
                    font-size: 12px;
                }

                input, select {
                    height: 30px;
                    border-radius: 20px;
                    border: 1px solid #33333344;
                    padding: 10px;
                    outline: none;
                    text-align: center;
                    margin: 0 5px;
                }

                select {
                    padding: 0px 10px;
                }

                main {
                    padding: 5rem 0;
                    display: grid;
                    align-items: center;
                    justify-items: center;
                    border-radius: 30px;
                    margin: 10px;
                    padding: 30px;
                    background: #2C3E5044;
                }

                main > div {
                    color: white;
                    text-align: center;
                }

                :globla(body) {
                    background: linear-gradient(180deg, #bdc3c7 0%, #3B4371 100%);
                }

                p {
                    color: white;
                }

                button {
                    border: none;
                    padding: 10px 30px;
                    border-radius: 30px;
                    background-color: #528B90;
                    color: white;
                    cursor: pointer;
                    transition: background-color 1s;
                    outline: none;
                    margin: 16px 0;
                }

                button:hover {
                    background-color: #51A8A7;
                }

            `}</style>

            <style jsx global>{`

              html, body {
                  padding: 0;
                  margin: 0;
                  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
                  Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
              }

              * {
                  box-sizing: border-box;
              }

      `}</style>

        </div>
    )
}

export default index

