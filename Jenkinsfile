pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "futurekawa-ci-${env.BUILD_NUMBER}"
        COMPOSE_ARGS         = "-f docker-compose.yml --env-file .env.ci"
        GITHUB_REPO          = "Francoistlb/mspr_tpre814_futurekawa"
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        pollSCM('* * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch : ${env.BRANCH_NAME} | Build #${env.BUILD_NUMBER}"
            }
        }

        stage('Prepare') {
            when { anyOf { branch 'develop'; branch 'main'; changeRequest() } }
            steps {
                withCredentials([file(credentialsId: 'env-ci', variable: 'ENV_CI_FILE')]) {
                    sh 'cp $ENV_CI_FILE .env.ci'
                }
            }
        }

        stage('Build') {
            when { anyOf { branch 'develop'; branch 'main'; changeRequest() } }
            steps {
                sh 'docker compose ${COMPOSE_ARGS} build --no-cache'
            }
        }

        stage('Start') {
            when { anyOf { branch 'develop'; branch 'main'; changeRequest() } }
            steps {
                sh 'docker compose ${COMPOSE_ARGS} up -d'
            }
        }

        stage('Health Checks') {
            when { anyOf { branch 'develop'; branch 'main'; changeRequest() } }
            steps {
                sh '''
                    wait_for() {
                        local svc=$1
                        echo "==> Attente du conteneur $svc..."
                        for i in $(seq 1 30); do
                            if docker compose ${COMPOSE_ARGS} exec -T "$svc" true 2>/dev/null; then
                                echo "$svc : conteneur accessible"
                                return 0
                            fi
                            sleep 2
                        done
                        echo "$svc : TIMEOUT — conteneur inaccessible apres 60s"
                        return 1
                    }
                    wait_for bresil-api
                    wait_for equateur-api
                    wait_for colombie-api
                    wait_for siege-api
                    echo "Tous les conteneurs sont demarres."
                '''
            }
        }

        stage('Tests') {
            when { anyOf { branch 'develop'; branch 'main'; changeRequest() } }
            steps {
                sh 'bash test-cicd/health-check.sh'
            }
        }

    }

    post {
        always {
            sh 'docker compose ${COMPOSE_ARGS} down -v --remove-orphans || true'
        }
        success {
            withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
                sh """
                    curl -s -X POST \
                        -H "Authorization: token \$GH_TOKEN" \
                        -H "Content-Type: application/json" \
                        -d '{"state":"success","description":"Jenkins CI passed","context":"jenkins/ci"}' \
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/\$(git rev-parse HEAD)
                """
            }
        }
        failure {
            sh 'docker compose ${COMPOSE_ARGS} logs --tail=50 || true'
            withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
                sh """
                    curl -s -X POST \
                        -H "Authorization: token \$GH_TOKEN" \
                        -H "Content-Type: application/json" \
                        -d '{"state":"failure","description":"Jenkins CI failed","context":"jenkins/ci"}' \
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/\$(git rev-parse HEAD)
                """
            }
        }
    }
}
