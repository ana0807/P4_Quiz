/**
 * Created by ana.martinez.martin on 1/03/18.
 */
const Sequelize = require('sequelize');

const {models} = require('./model');

const {log ,biglog,errorlog,colorize}=require('./out');

// Promesa auxiliar
const validateId = id => {

    return new Sequelize.Promise((resolve,reject)=>{
        if (typeof id === "undefined"){
        reject(new Error(`Falta el parametro<id>.`));
    }else{
        id = parseInt(id); // coge la parte entera y descarga lo demas
        if(Number.isNaN(id)){
            reject(new Error(`El valor del parámetro <id> no es un `))
        }else{
            resolve(id);
        }
    }
});
};

const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve,reject)=> {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};


exports.helpCmd=rl=>{
    log("Comandos:");
    log("h|help - Muestra esta ayuda.");
    log("list - Listar los quizzes existentes.");
    log("show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log("add - Añadir un nuevo quiz interactivamente." );
    log("delete<id> - Borrar el quiz indicado.");
    log("edit <id> - Editar el quiz indicado.");
    log("test <id> - Probar el quiz indicado.");
    log("p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("credits - Créditos.");
    log("q|quit - Salir del programa.");
    rl.prompt();
};



exports.quitCmd=rl=>{
    rl.close();
};


exports.addCmd= rl =>{
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, 'Introduzca la respuesta')
                .then(a => {
                    return {question:q, answer:a};
            });
    })
    .then(quiz => {
        return models.quiz.create(quiz);

    })
    .then((quiz)=> {
        log(`${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error =>{ //error de validacion
        errorlog('El quiz es erroneo: ');
        error.errors.forEach(({message})=> errorlog(message));
    })
    .catch(error => { //cualquier otro tipo de error
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

exports.listCmd=rl=>{

    models.quiz.findAll() //promesa
        .each(quiz => {
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(()=>{
            rl.prompt();
    });
};



exports.showCmd=(rl,id)=>{

    validateId(id)
        .then(id=> models.quiz.findById(id))
        .then(quiz=>{
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
             log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
    });

};


exports.testCmd=(rl,id)=> {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            rl.question(colorize(`${quiz.question}`,'red') , resp=>{
                if (resp.toLowerCase().trim()=== quiz.answer.toLowerCase().trim() ){
                    log('Su respuesta es correcta');
                    biglog('CORRECTO', 'green');

                } else {
                    log('Su respuesta es incorrecta');
                    biglog('INCORRECTO', 'red');
                }rl.prompt();

            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }

    }
};
   // log('Probar el quiz indicado.','red');
    //rl.prompt();





exports.deleteCmd=(rl,id)=>{

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(error.message);
    })
    .then(() =>{
        rl.prompt();
    }) ;

};


exports.editCmd=(rl,id)=>{

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz =>{
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
            return makeQuestion(rl, 'Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.answer)},0);
                    return makeQuestion(rl, 'Introduzca la respuesta')
                        .then(a =>{
                            quiz.question =q;
                            quiz.answer =a;
                            return quiz;
                    });

            });
    })
    .then(quiz =>{
        return quiz.save();
    })
    .then(quiz => {
        log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);

    })
    .catch(Sequelize.ValidationError, error =>  {
        errorlog('El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });

};


exports.playCmd=rl=>{
    let score = 0;

    let toBeResolved = [];

    let i=0;

    for (i= 0; i<model.getAll().length;i++){
        toBeResolved[i]=model.getByIndex(i);
    }

    const playOne = ()=>{
   
    if (toBeResolved.length===0) {
        errorlog('No hay nada más que preguntar');
                log(`Fin del juego. Aciertos: ${score}`);
                biglog(score,'magenta');
                rl.prompt();

    }else {
        let indice = Math.floor(Math.random()*(toBeResolved.length))

        let quiz= toBeResolved[indice];

        rl.question(colorize(`${quiz.question}`,'red'), resp => {
            if (resp===quiz.answer){
                
             log(`CORRECTO - Lleva  ${colorize(score++,'magenta')} aciertos`);
             score++;
             playOne();

            } else{
            log(`Resultad incorrecto. Totales correctas: ${colorize(score,'magenta')}`);
log(`Fin del Juego. Aciertos: ${score}` );
    biglog(score,'magenta');
                rl.prompt();
        }

        });rl.prompt();
    }
}

playOne();

   // log('Jugar.','red');
   // rl.prompt();
};


exports.creditsCmd=rl=>{
    log('Autores de la practica:','red');
    log('ANA','green');
    log('SELENE','green');
    rl.prompt();
};

