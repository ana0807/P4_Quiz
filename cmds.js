/**
 * Created by ana.martinez.martin on 1/03/18.
 */


const model=require('./model');

const {log ,biglog,errorlog,colorize}=require('./out');



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


exports.addCmd=rl=>{
    //log('Añadir un nuevo quiz','red');
    rl.question(colorize('Introduzca una pregunta: ', 'red'),question =>{

        rl.question(colorize('Introduzca la respuesta ', 'red'),answer =>{

            model.add(question,answer);
            log(`${colorize('Se ha añadido','magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`);

            rl.prompt();
        });
    });

};

exports.listCmd=rl=>{
    //log('Listar todos los quizzes existentes.','red');
    model.getAll().forEach((quiz,id)=>{

        log(`[${colorize(id,'magenta')}]: ${quiz.question}`);
    });



    rl.prompt();
};


exports.showCmd=(rl,id)=>{
    //log('Mostrar el quiz indicado.','red');
    if (typeof id ==="undefined"){
        errorlog(`Falta el parámetro id.`);
    } else {
        try{
            const quiz = model.getByIndex(id);
            log(`[${colorize(id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        } catch(error){
            errorlog(error.message);
        }

    }


    rl.prompt();
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
    if (typeof id ==="undefined"){
        errorlog(`Falta el parámetro id.`);
    } else {
        try{
            model.deleteByIndex(id);
        } catch(error){
            errorlog(error.message);
        }

    }


    rl.prompt();
};


exports.editCmd=(rl,id)=>{
    if (typeof id=== "undefined"){
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    }else {
        try {
            const quiz =model.getByIndex(id);

            process.stdout.isTTY && setTimeout(()=>{rl.write(quiz.question)},0);
            rl.question(colorize('Introduzca una pregunta:','red'),question =>{

                process.stdout.isTTY && setTimeout(()=>{rl.write(quiz.answer)},0);
                rl.question(colorize('Introduzca la respuesta:','red'),answer=>{
                    model.update(id,question,answer);
                    log(`Se ha cambiado el quiz ${colorize(id,'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${colorize(answer,'magenta')}`);
                    rl.prompt();
                    });
            });

        }catch (error){
            errorlog(error.message);
            rl.prompt();
        }
    }

};


exports.playCmd=rl=>{
    let score = 0;

    let toBeResolved = [];

    let i=0;

    for (i= 0; i<model.getAll().length;i++){
        toBeResolved[i]=i;
    }

    const playOne = ()=>{
   
    if (toBeResolved===null) {
        log('No hay nada más que preguntar');
                log(`Fin del juego. Aciertos: ${score}`);
                biglog(score,'magenta');
rl.prompt();

    }else {
        let indice = Math.floor(Math.random(toBeResolved.length))

        let quiz= toBeResolved[indice];

        rl.question(colorize(`${quiz.question}`,'red'), resp => {
            if (resp===quiz.answer){
                score++;
             log(`CORRECTO - Lleva  ${score} aciertos`);
             
             playOne();

            } else{
            log('INCORRECTO./n');
log('Fin del Juego. Aciertos: ' +score);
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

