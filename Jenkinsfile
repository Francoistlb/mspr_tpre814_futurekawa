pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "futurekawa-ci-${env.BUILD_NUMBER}"
        ENV_FILE             = ".env.ci"
        GITHUB_REPO          = "Francoistlb/mspr_tpre814_futurekawa"
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    // Polling toutes les 5 minutes — pas besoin de webhook ni de serveur public
    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch : ${env.BRANCH_NAME} | Build #${env.BUILD_NUMBER}"
            }
        }

        stage('Build') {
            when { branch 'develop' }
            steps {
                sh 'docker compose --env-file ${ENV_FILE} build --no-cache'
            }
        }

        stage('Start') {
            when { branch 'develop' }
            steps {
                sh 'docker compose --env-file ${ENV_FILE} up -d'
            }
        }

        stage('Health Checks') {
            when { branch 'develop' }
            steps {
                sh '''
                    check() {
                        local svc=$1
                        echo "==> Attente de $svc..."
                        for i in $(seq 1 30); do
                            if docker compose --env-file "$ENV_FILE" exec -T "$svc" \
                               python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" \
                               2>/dev/null; then
                                echo "$svc : OK"
                                return 0
                            fi
                            sleep 2
                        done
                        echo "$svc : TIMEOUT apres 60s"
                        return 1
                    }
                    check bresil-api
                    check equateur-api
                    check colombie-api
                    check siege-api
                    echo "Tous les services sont operationnels."
                '''
            }
        }

        stage('Tests') {
            when { branch 'develop' }
            steps {
                echo 'Tests a implementer — Etape 7'
            }
        }

    }

    post {
        always {
            sh 'docker compose --env-file ${ENV_FILE} down -v --remove-orphans || true'
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
            sh 'docker compose --env-file ${ENV_FILE} logs --tail=50 || true'
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
